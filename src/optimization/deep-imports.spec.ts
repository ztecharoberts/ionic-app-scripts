import { join } from 'path';
import * as deepImports from './deep-imports';


describe('Deep Imports', () => {
  describe('findNodeModuleImports', () => {
    it('should find the import and require statements that are not relative', () => {
      // arrange
      const knownContent = `
import { PageTwo } from '../page-two/page-two';
import { PageThree } from './page-three/page-three';
import { Component } from "@angular/core";
import { NavController } from \`ionic-angular\`;
import { NavController } from 'moment';
import * as something from 'rollup';


var something = require('datetime');
var something2 = require("lodash");
var something3 = require(\`react\`);
var something4 = require('./page-four/page-four');
var something5 = require('../page-five/page-five');

      `;
      // act
      const resultMap = deepImports.findNodeModuleImports(knownContent);

      // assert
      const values = Array.from(resultMap.values());
      expect(values.indexOf('@angular/core')).toBeGreaterThan(-1);
      expect(values.indexOf('ionic-angular')).toBeGreaterThan(-1);
      expect(values.indexOf('moment')).toBeGreaterThan(-1);
      expect(values.indexOf('rollup')).toBeGreaterThan(-1);
      expect(values.indexOf('datetime')).toBeGreaterThan(-1);
      expect(values.indexOf('lodash')).toBeGreaterThan(-1);
      expect(values.indexOf('react')).toBeGreaterThan(-1);

    });
  });

  describe('getModulesImportedByImportee', () => {
    it('should return a set of modules imported by a givevn module', () => {
      // arrange
      const map = new Map<string, Set<string>>();

      const appRoot = join('/Users', 'dan', 'myApp');
      const appEntryPoint = join(appRoot, 'app', 'app.module');
      const depOne = join(appRoot, 'src', 'page-one');
      const depTwo = join(appRoot, 'src', 'page-two');
      const angularCore = join(appRoot, 'node_modules', '@angular', 'core', 'index');
      const angularCommon = join(appRoot, 'node_modules', '@angular', 'common', 'index');
      const ionicAngular = join(appRoot, 'node_modules', '@angular', 'ionic-angular', 'index');

      const depOneSet = new Set<string>();
      depOneSet.add(appEntryPoint);

      const depTwoSet = new Set<string>();
      depTwoSet.add(appEntryPoint);

      const angularCoreSet = new Set<string>();
      angularCoreSet.add(appEntryPoint);
      angularCoreSet.add(depOne);
      angularCoreSet.add(depTwo);
      angularCoreSet.add(ionicAngular);

      const angularCommonSet = new Set<string>();
      angularCommonSet.add(depOne);
      angularCommonSet.add(ionicAngular);

      const ionicAngularSet = new Set<string>();
      ionicAngularSet.add(appEntryPoint);
      ionicAngularSet.add(depOne);
      ionicAngularSet.add(depTwo);

      map.set(appEntryPoint, new Set<string>());
      map.set(depOne, depOneSet);
      map.set(depTwo, depTwoSet);
      map.set(angularCore, angularCoreSet);
      map.set(angularCommon, angularCommonSet);
      map.set(ionicAngular, ionicAngularSet);

      // act
      const results = deepImports.getModulesImportedByImportee(map, ionicAngular);

      // assert
      expect(results.size).toEqual(2);
      expect(results.has(angularCore)).toBeTruthy();
      expect(results.has(angularCommon)).toBeTruthy();
    });
  });

  describe('processImports', () => {
    it('should do something', () => {
      // arrange
      const appRoot = join('/Users', 'dan', 'myApp');
      const nodeModulesDir = join(appRoot, 'node_modules');
      const appEntryPoint = join(appRoot, 'app', 'app.module.js');
      const pageOne = join(appRoot, 'src', 'pages', 'page-one.js');
      const pageTwo = join(appRoot, 'src', 'pages', 'page-two.js');
      const angularEntryPoint = join(nodeModulesDir, '@angular', 'core', 'index.js');
      const angularComponent = join(nodeModulesDir, '@angular', 'core', 'src', 'component.js');
      const ionicAngularEntryPoint = join(nodeModulesDir, 'ionic-angular', 'index.js');
      const ionicAngularNavController = join(nodeModulesDir, 'ionic-angular', 'navigation', 'nav-controller.js');
      const nodeUuidEntryPoint = join(nodeModulesDir, 'node-uuid', 'index.js');
      const momentEntryPoint = join(nodeModulesDir, 'moment', 'lib', 'moment.js');

      const pageOneSet = new Set<string>();
      pageOneSet.add(appEntryPoint);

      const pageTwoSet = new Set<string>();
      pageTwoSet.add(appEntryPoint);

      const angularEntryPointSet = new Set<string>();
      angularEntryPointSet.add(pageOne);
      angularEntryPointSet.add(pageTwo);
      angularEntryPointSet.add(ionicAngularEntryPoint);
      angularEntryPointSet.add(ionicAngularNavController);

      const angularComponentSet = new Set<string>();
      angularComponentSet.add(angularEntryPoint);

      const ionicAngularPointSet = new Set<string>();
      ionicAngularPointSet.add(pageOne);
      ionicAngularPointSet.add(pageTwo);

      const ionicAngularNavControllerSet = new Set<string>();
      ionicAngularNavControllerSet.add(ionicAngularEntryPoint);

      const nodeUuidEntryPointSet = new Set<string>();
      nodeUuidEntryPointSet.add(pageOne);

      const momentEntryPointSet = new Set<string>();
      momentEntryPointSet.add(pageOne);

      const dependencyMap = new Map<string, Set<string>>();
      dependencyMap.set(appEntryPoint, new Set<string>());
      dependencyMap.set(pageOne, pageOneSet);
      dependencyMap.set(pageTwo, pageTwoSet);
      dependencyMap.set(angularEntryPoint, angularEntryPointSet);
      dependencyMap.set(angularComponent, angularComponentSet);
      dependencyMap.set(ionicAngularEntryPoint, ionicAngularPointSet);
      dependencyMap.set(ionicAngularNavController, ionicAngularNavControllerSet);
      dependencyMap.set(nodeUuidEntryPoint, nodeUuidEntryPointSet);
      dependencyMap.set(momentEntryPoint, momentEntryPointSet);

      const knownContent = `
import { Component } from '@angular/core';

import { NavController } from 'ionic-angular';

import { PageOne } from '../page-one/page-one';

const uuid = require('node-uuid');
const moment = require('moment');

@Component({
  selector: 'page-home',
  template: \`
  <ion-header>
    <ion-navbar>
      <ion-title>
        Ionic Blank
      </ion-title>
    </ion-navbar>
  </ion-header>

  <ion-content padding>
    The world is your oyster.
    <p>
      If you get lost, the <a href="http://ionicframework.com/docs/v2">docs</a> will be your guide.
    </p>
    <button ion-button (click)="nextPage()">Next Page</button>
  </ion-content>
  \`
})
export class HomePage {

  constructor(public navCtrl: NavController) {
  }

  nextPage() {
    this.navCtrl.push(PageOne);
    console.log()
  }
}
      `;

      // act

      const result = deepImports.processImports(dependencyMap, pageOne, knownContent, nodeModulesDir);

      // assert
      expect(result).toBeTruthy();
      expect(result.indexOf(`import { Component } from '@angular/core'`)).toEqual(-1);
      expect(result.indexOf(`import { Component } from '@angular/core/index'`)).toBeGreaterThan(-1);
      expect(result.indexOf(`import { NavController } from 'ionic-angular'`)).toEqual(-1);
      expect(result.indexOf(`import { NavController } from 'ionic-angular/index'`)).toBeGreaterThan(-1);
      expect(result.indexOf(`const uuid = require('node-uuid');`)).toEqual(-1);
      expect(result.indexOf(`const uuid = require('node-uuid/index');`)).toBeGreaterThan(-1);
      expect(result.indexOf(`const moment = require('moment');`)).toEqual(-1);
      expect(result.indexOf(`const moment = require('moment/lib/moment');`)).toBeGreaterThan(-1);
      expect(result.indexOf(`import { PageOne } from '../page-one/page-one';`)).toBeGreaterThan(-1);
    });
  });
});

