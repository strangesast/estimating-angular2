import { EstimatingAngular2Page } from './app.po';

describe('estimating-angular2 App', function() {
  let page: EstimatingAngular2Page;

  beforeEach(() => {
    page = new EstimatingAngular2Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
