import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthStore } from '@app/core/services/store/auth-store.service';
import type { AuthRole } from '@app/shared/models/auth.model';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  const roleSignal = signal<AuthRole | null>(null);

  beforeEach(async () => {
    roleSignal.set(null);
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            role: roleSignal.asReadonly(),
          },
        },
      ],
    }).compileComponents();
  });

  it('shows loading copy until role is resolved', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading role...');
  });

  it('shows current role label for viewer', () => {
    roleSignal.set('viewer');
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Current role: viewer');
  });
});
