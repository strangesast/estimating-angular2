/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ElementService } from './element.service';
import { HttpService } from './http/http.service';
import { GitService } from './git/git.service';

describe('ElementService', () => {
  let dbName = 'estimating-testing';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ElementService, HttpService, GitService]
    });
  });

  let db;

  it('should init service', inject([ElementService], (service: ElementService) => {
    expect(service).toBeTruthy();

    it('should init db', done => {
      return service.init(dbName).then(db => {
        expect(db instanceof IDBDatabase).toBeTruthy();
        done();
      });
    });

    let lastJob;
    it('should create job, then destroy it', done => {
      service.createJob('test').take(2).timeout(500).finally(()=>{
        service.removeRecord('collections', lastJob.id);
      }).subscribe(job => {
        lastJob = job
        console.log(JSON.stringify(job, null, 2));
        expect(job).toBeTruthy();

      }, err => {
        console.log('err', err);
      }, () => {
        console.log('complete');
        done();
      });
    });

  }));




  afterEach(() => {
    indexedDB.deleteDatabase(dbName);
  });
});
