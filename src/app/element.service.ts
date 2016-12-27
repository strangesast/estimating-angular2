import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';

import { Observable, BehaviorSubject } from 'rxjs';

import { HttpService } from './http/http.service';
import { GitService } from './git/git.service';

import { UserInterface, ChildElement, Collection, FolderElement, ComponentElement } from './classes';

interface StoreDefinition {
  name: string;
  keypath: string,
  indexes?: {
    on: string,
    name: string,
    unique: boolean,
    multiEntry?: boolean
  }[];
};

// indexeddb key generator
function random():string {
  return (Math.random().toString(36)+'00000000000000000').slice(2, 10+2);
}

const STORES = [
  { name: 'users',
    keypath: 'username',
    indexes: [
      { on: 'name',      name: 'name',      unique: false },
      { on: 'email',     name: 'email',     unique: true  }
    ]
  },
  { name: 'components',
    keypath: 'id',
    indexes: [
      { on: 'children',  name: 'children',  unique: false, multiEntry: true },
      { on: 'job',       name: 'job',       unique: false }
    ]
  },
  { name: 'folders',
    keypath: 'id',
    indexes: [
      { on: 'type',      name: 'type',      unique: false },
      { on: 'job',       name: 'job',       unique: false }
    ]
  },
  { name: 'locations',
    keypath: 'id',
    indexes: [
      { on: 'children',  name: 'children',  unique: false, multiEntry: true },
      { on: 'folders',   name: 'folders',   unique: true,  multiEntry: true },
      { on: 'job',       name: 'job',       unique: false }
    ]
  },
  { name: 'collections',
    keypath: 'id',
    indexes: [
      { on: 'shortname', name: 'shortname', unique: true  }
    ]
  }
];

function initObjectStore(name:string, version:number, stores:StoreDefinition[]): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open(name, version);
    request.onupgradeneeded = (e:any) => {
      let db = e.target.result;
      let createStore = (name, keypath, indexes) => {
        let store = db.createObjectStore(name, { keyPath: keypath });
        indexes.forEach((index)=> {
          store.createIndex(index.name, index.on, { unique: index.unique, multiEntry: !!index.multiEntry });
        });
      }
      let trans = e.target.transaction;
      stores.forEach((store)=> {
        if(db.objectStoreNames.contains(store.name)) {
          db.deleteObjectStore(store.name);
        }
        createStore(store.name, store.keypath, store.indexes);
      });
      trans.onsuccess = (e) => {
        resolve(db);
      }
    };
    request.onsuccess = (e:any) => {
      let db = e.target.result;
      resolve(db);
    };
  });
}

const DB_NAME = 'estimating';
const DB_VERSION = 1;

@Injectable()
export class ElementService implements Resolve<any> {
  private db: IDBDatabase;

  private owner: UserInterface;

  private dbName = DB_NAME;
  private dbVersion = DB_VERSION;

  public jobs: BehaviorSubject<any[]>;

  constructor(private http: HttpService, private git: GitService) { }

  resolve() {
    return this.init();
  }

  setOwner(owner: UserInterface) {
    this.owner = owner;
  }

  init(name=this.dbName,version=this.dbVersion) {
    this.setOwner({
      name: 'Sam Zagrobelny',
      username: 'sazagrobelny',
      email: 'Samuel.Zagrobelny@dayautomation.com'
    });
    return this.db ? Promise.resolve(this.db) : initObjectStore(name, version, STORES).then(db => {
      return this.db = db;
    });
  }

  getJobs() {
    return this.jobs ? Promise.resolve(this.jobs) : this.retrieveAllRecordsAs(Collection).then(jobs => {
      return this.jobs = new BehaviorSubject(jobs
        .filter(job => job.kind == 'job')
        .map(job => new BehaviorSubject(job))
      );
    });
  }

  createJob(name, shortname?, description='', folderNames=['phase', 'building']) {
    let folderDefinition = { order: folderNames };
    shortname = shortname || name.replace(' ', '_').replace(/[^\w-]/gi, '').substring(0, 50);
    let job = new Collection('', name, description, 'job', folderDefinition, this.owner, shortname);
    let bs = new BehaviorSubject(job);

    bs.subscribe(_job => {
      console.log('job changes', _job);
    }, (err)=>{
      console.log('error', err);
    });

    Promise.resolve().then(() => {
      if(!shortname) {
        throw new Error('invalid shortname');
      }
      if(shortname.length < 4) {
        throw new Error('shortname must be at least 4 characters long');
      }

      return this.saveRecordAs(job).then(result => {
        console.log('result', result);
        job.id = result;
        job.saveState = 'saved:uncommitted';
        bs.next(job);

        this.jobs.next(this.jobs.getValue().concat(bs))

      });
    }).catch(err => {
      bs.error(err);
    });
    
    return bs;
  }

  saveRecord(storeName: string, obj: any) {
    return new Promise((resolve, reject) => {
      let trans = this.db.transaction(storeName, 'readwrite');
      let store = trans.objectStore(storeName);
      let req;
      if(obj.id == '') { // new objects have { id: '', ... }
        // need to check random() unique-ness
        obj.id = random();
        req = store.add(obj);
      } else {
        req = store.put(obj);
      }
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  saveRecordAs(obj: ComponentElement|FolderElement|Collection): Promise<string> {
    if (typeof (<any>obj.constructor).storeName !== 'string' || typeof obj.toJSON !== 'function') {
      throw new Error('improper instance of class');
    }
    let storeName = (<any>obj.constructor).storeName;
    return this.saveRecord(storeName, obj.toJSON())
  }

  retrieveRecord(storeName: string, id: string, key?: string) {
    return new Promise((resolve, reject)=> {
      let trans = this.db.transaction([storeName]);
      let req:any = trans.objectStore(storeName);
      if(key!=null) req = req.index(key);
      req = req.get(id);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  retrieveRecordAs(_class: any, id: string, key?: string): Promise<Collection|FolderElement|ComponentElement> {
    if (typeof _class.storeName !== 'string') {
      throw new Error('improper class or class definition');
    }
    let storeName = _class.storeName;
    return this.retrieveRecord(storeName, id, key).then(record => {
      let el = _class.fromObject(record);
      el.saveState = 'saved:uncommitted';
      return el;
    });
  }

  retrieveAllRecords(storeName: string, query?: IDBKeyRange, max?: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let trans = this.db.transaction([storeName]);
      let store = trans.objectStore(storeName); let req = (<any>store).getAll(query, max);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  retrieveAllRecordsAs(_class: any, query?: IDBKeyRange, max?: number): Promise<any[]> {
    if (typeof _class.storeName !== 'string') {
      throw new Error('improper class or class definition');
    }
    let storeName = _class.storeName;
    return this.retrieveAllRecords(storeName, query, max).then(records => {
      return records.map(_class.fromObject.bind(_class)).map((el:any)=>{
        el.saveState='saved:uncommitted'
        return el;
      });
    });
  }

  removeRecord(storeName: string, id: string, key?: string) {
    return new Promise((resolve, reject) => {
      let trans = this.db.transaction(storeName, 'readwrite');
      let store:any = trans.objectStore(storeName);
      if(key!=null) store = store.index(key);
      let req = store.delete(id);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }
}
