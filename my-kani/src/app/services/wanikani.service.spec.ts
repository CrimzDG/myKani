import { TestBed } from '@angular/core/testing';

import { WanikaniService } from './wanikani.service';

describe('WanikaniService', () => {
  let service: WanikaniService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WanikaniService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
