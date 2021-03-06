/**
 * Copyright 2017 IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component } from '@angular/core';
import { NavController, LoadingController } from 'ionic-angular';
import { ImgCacheService } from 'ng-imgcache';

import { MyWardDataProvider } from '../../providers/my-ward-data/my-ward-data';
import { AuthHandlerProvider } from '../../providers/auth-handler/auth-handler';
import { JsonStoreHandlerProvider } from '../../providers/json-store-handler/json-store-handler';
import { ProblemDetailPage } from '../problem-detail/problem-detail';
import { ReportNewPage } from '../report-new/report-new';
import { LoginPage } from '../login/login';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  loader: any;
  grievances: any;
  objectStorageAccess: any;

  constructor(public navCtrl: NavController, public loadingCtrl: LoadingController,
    public myWardDataProvider: MyWardDataProvider, public imgCache: ImgCacheService,
    private authHandler:AuthHandlerProvider, private jsonStoreHandler:JsonStoreHandlerProvider) {
    console.log('--> HomePage constructor() called');
  }

  ionViewDidLoad() {
    console.log('--> HomePage ionViewDidLoad() called');
    this.loader = null;
    this.loadData();
  }

  ionViewWillEnter() {
    console.log('--> HomePage ionViewWillEnter() called');
    this.initAuthChallengeHandler();
    this.jsonStoreHandler.setOnSyncSuccessCallback(() => {
      console.log('--> HomePage onSyncSuccessCallback() called');
      this.loadData();
    });
  }

  loadData() {
    if (this.loader == null) {
      console.log('--> HomePage creating new loader');
      this.loader = this.loadingCtrl.create({
        content: 'Loading data. Please wait ...'
      });
      this.loader.present().then(() => {
        this.loadDataFromJsonStore();
      });
    } else {
      console.log('--> HomePage reusing previous loader');
      this.loadDataFromJsonStore();
    }
  }

  loadDataFromJsonStore() {
    this.jsonStoreHandler.getObjectStorageAccess().then(objectStorageAccess => {
      if (objectStorageAccess != null) {
        this.objectStorageAccess = objectStorageAccess;
        this.imgCache.init({
          headers: {
            'Authorization': this.objectStorageAccess.authorizationHeader
          }
        }).then( () => {
          console.log('--> HomePage initialized imgCache');
          this.jsonStoreHandler.getData().then(data => {
            this.grievances = data;
            this.loader.dismiss();
            this.loader = null;
          });
        });
      } else {
        console.log('--> HomePage objectStorageAccess not yet loaded');
      }
    });
  }

  // https://www.joshmorony.com/a-simple-guide-to-navigation-in-ionic-2/
  itemClick(grievance) {
    this.navCtrl.push(ProblemDetailPage, { grievance: grievance, baseUrl: this.objectStorageAccess.baseUrl });
  }

  reportNewProblem(){
    this.navCtrl.push(ReportNewPage);
  }

  refresh() {
    // this.jsonStoreHandler.syncMyWardData();
    this.loadData();
  }

  initAuthChallengeHandler() {
    this.authHandler.setHandleChallengeCallback(() => {
      this.loader.dismiss();
      this.navCtrl.push(LoginPage, { isPushed: true });
    });
    this.authHandler.setLoginSuccessCallback(() => {
      let view = this.navCtrl.getActive();
      if (view.instance instanceof LoginPage) {
        this.navCtrl.pop().then(() =>{
          this.loader = this.loadingCtrl.create({
            content: 'Loading data. Please wait ...'
          });
          this.loader.present();
        });
      }
    });
  }
}
