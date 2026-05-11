import { TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();
  });

  it('renders title and subtitle', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Taskflow');
    expect(host.querySelector('p')?.textContent?.trim()).toContain('task');
  });
});
