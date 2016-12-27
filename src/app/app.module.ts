import { BrowserModule } from '@angular/platform-browser';
import { NgModule }      from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule }  from '@angular/forms';
import { HttpModule }    from '@angular/http';

import { RoutingModule } from './routing.module';

import { GitService } from './git/git.service';
import { HttpService } from './http/http.service';

import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    RoutingModule
  ],
  providers: [
    HttpService,
    GitService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
