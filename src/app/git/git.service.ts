import { Injectable } from '@angular/core';
import { Resolve }    from '@angular/router';

import { createGitRepo, Repo } from './git';

const GIT_DB_NAME = 'estimating-git';
const GIT_DB_VERSION = 1;

@Injectable()
export class GitService implements Resolve<any> {
  repo: Repo;

  constructor() { }

  resolve() {
    return createGitRepo(GIT_DB_NAME, GIT_DB_VERSION).then(repo => {
      this.repo = repo;
    });
  }

}
