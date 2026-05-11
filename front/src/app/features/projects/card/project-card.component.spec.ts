import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { Project } from '@app/shared/models/project.model';
import { ProjectCardComponent } from './project-card.component';

describe('ProjectCardComponent', () => {
  const project: Project = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Demo project',
    description: 'Desc text',
    author: 'Author name',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('links to project board and shows metadata', () => {
    const fixture = TestBed.createComponent(ProjectCardComponent);
    fixture.componentRef.setInput('project', project);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const link = host.querySelector('a') as HTMLAnchorElement;

    expect(link.href).toContain('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(link.textContent?.trim()).toBe('Demo project');
    expect(host.textContent).toContain('Desc text');
    expect(host.textContent).toContain('Author name');
  });
});
