/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { GitService } from './git.service';

describe('GitService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GitService]
    });
  });

  it('should create git repo', inject([GitService], (service: GitService) => {
    expect(service).toBeTruthy();
    return service.resolve().then(repo => {
      expect(service.repo).toBeTruthy();
    });
  }));
});
