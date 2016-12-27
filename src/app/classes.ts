//                      not in commit         in commit       saved remotely   none of the prev
export type SaveState = "saved:uncommitted" | "saved:local" | "saved:remote" | "unsaved";

export interface UserInterface {
  name: string;
  username: string;
  email: string;
};

export interface FolderDefinition {
  roots?: any; // { 'phase' : 'abcd123', 'building': 'efgh456' }
  order: string[]; // [ 'phase', 'building' ]
};

// include as much information as possible about copy-from
export interface BasedOn {
  id: string,
  _id: string,
  hash: string,
  version: string
}

export class Collection {
  static exclude = ['commit', 'hash', 'saveState'];
  static storeName = 'collections';

  static fromObject(obj: any) {
    return new Collection(
      obj.id,
      obj.name,
      obj.description,
      obj.kind,
      obj.folderDefinition,
      obj.owner,
      obj.shortname,
      obj.commit,
      obj.hash,
      obj.saveState
    );
  }

  constructor(
    public id:   string,
    public name: string,
    public description: string,
    public kind: 'job'|'library' = 'job',
    public folderDefinition: FolderDefinition,
    public owner: UserInterface,
    public shortname: string,
    public commit?: string,
    public hash?: string,
    public saveState: SaveState = 'unsaved'
  ) { }

  toJSON(removeExcluded=true) {
    let copy = Object.assign({}, this);
    if (removeExcluded) {
      Collection.exclude.forEach(x=>x in copy ? (delete copy[x]) : null);
    }
    return copy;
  }
};

export class FolderElement {
  static exclude = ['open', 'saveState'];
  static storeName = 'folders';

  static fromObject(obj: any) {
    return new FolderElement(
      obj.id,
      obj.name,
      obj.description,
      obj.type,
      obj.collection,
      obj.children.map(child => typeof child === 'string' ? child : FolderElement.fromObject(child)),
      obj.open,
      obj.saveState
    );
  }

  constructor(
    public id: string,
    public name: string,
    public description: string,
    public type: string,
    public collection: string, // collection.id
    public children: string[]|FolderElement[]=[],
    public open: boolean = false,
    public saveState: SaveState = 'unsaved'
  ) { }

  toJSON(removeExcluded=true) {
    let copy = Object.assign({}, this);
    if (removeExcluded) {
      FolderElement.exclude.forEach(x=>x in copy ? (delete copy[x]) : null);
      if(copy.children) {
        copy.children = (<any[]>copy.children).map(child => {
          if (typeof child === 'string') {
            return child;

          } else if (child instanceof FolderElement && typeof child.id === 'string') {
            return child.id;

          } else {
            throw new Error('invalid child');

          }
        });
      }
    }
    return copy;
  }
}

export class LocationElement {
  static exclude = ['saveState', 'hash'];

  static fromObject(obj: any) {
    return new LocationElement(
      obj.id,
      obj.collection,
      obj.children.map(child => !(child instanceof ChildElement) ? ChildElement.fromObject(child) : child),
      obj.folders,
      obj.hash,
      obj.saveState
    );
  }

  constructor(
    public id: string,
    public collection: string,
    public children: ChildElement[] = [],
    public folders: any, // { 'phase' : 'abcd123', 'building': 'efgh456' }
    public hash?: string,
    public saveState: SaveState = 'unsaved'
  ) { }

  toJSON(removeExcluded=true) {
    let copy = Object.assign({}, this);
    if (removeExcluded) {
      LocationElement.exclude.forEach(x=>x in copy ? (delete copy[x]) : null);
      if(copy.children) {
        copy.children = (<any[]>copy.children).map(child => {
          if(!(child instanceof ChildElement && typeof child.id === 'string')) {
            throw new Error('invalid child');
          }
          return child.toJSON(removeExcluded);
        });
      }
    }
    return copy;
  }

}

export class ChildElement {
  static exclude = ['saveState', 'folders', 'data'];

  static fromObject(obj: any) {
    return new ChildElement(
      obj.id,
      obj.ref,
      obj.qty,
      obj._ref,
      obj.data,
      obj.folders,
      obj.saveState
    );
  }

  constructor(
    public id: string,
    public ref: string,
    public qty: number,
    public _ref?: string,
    public data?: any,
    public folders?: any,
    public saveState: SaveState = 'unsaved'
  ) { }

  toJSON(removeExcluded=true) {
    let copy = Object.assign({}, this);
    if (removeExcluded) {
      ChildElement.exclude.forEach(x=>x in copy ? (delete copy[x]) : null);
    }
    return copy;
  }
}

export class ComponentElement {
  static exclude = ['hash', 'saveState'];
  static storeName = 'components';

  static fromObject(obj: any) {
    return new ComponentElement(
      obj.id,
      obj.name,
      obj.description,
      obj.collection,
      obj.children.map(child => typeof child === 'string' ? child : ChildElement.fromObject(child)),
      obj.basedOn,
      obj.hash,
      obj.saveState
    );
  }

  constructor(
    public id: string,
    public name: string,
    public description: string,
    public collection: string,
    public children: ChildElement[]=[],
    public readonly basedOn?: BasedOn,
    public hash?: string,
    public saveState: SaveState = 'unsaved'
  ) { }

  toJSON(removeExcluded=true) {
    let copy = Object.assign({}, this);
    if (removeExcluded) {
      ComponentElement.exclude.forEach(x=>x in copy ? (delete copy[x]) : null);
      if(copy.children) {
        copy.children = (<any[]>copy.children).map(child => {
          if (!(child instanceof ChildElement && typeof child.id === 'string')) {
            throw new Error('invalid child');
          }
          return child;
        });
      }
    }
    return copy;
  }
}
