import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GitService }  from './git/git.service';
import { HttpService } from './http/http.service';
import { ElementService } from './element.service';

import { MainComponent } from './main/main.component';

const routes = [
  //{ path: '', redirectTo: '',, pathMatch: 'full' }
  { path: '', component: MainComponent, resolve: { element: ElementService } }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ],
  providers: [
    ElementService
  ],
  declarations: []
})
export class RoutingModule { }
