import { Component, OnInit } from '@angular/core';
import { ElementService } from '../element.service';

import { FormBuilder } from '@angular/forms';

import { Observable } from 'rxjs';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  private jobsSubject;
  public jobs = [];

  public job;
  public error;

  public name = 'test';

  constructor(private elementService: ElementService, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.elementService.getJobs().then(_jobsSubject => {
      this.jobsSubject = _jobsSubject

      this.jobsSubject.flatMap(jobs => {
        return Observable.combineLatest(...jobs)
      }).subscribe(jobs => {
        this.jobs = jobs
      });
    });
  }

  createNew() {
    let job = this.elementService.createJob(this.name);
    let sub = job.subscribe(_job => {
      this.job = _job;
      console.log('job', _job.id, _job.saveState);
    }, err => {
      console.log('error', err);
      this.error = err;
      sub.unsubscribe();
    });
  }

}
