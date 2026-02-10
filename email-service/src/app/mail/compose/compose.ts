/**
 * Compose Component
 *
 * TODO: connect to nodemailer
 */

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { HttpClient } from '@angular/common/http';

interface Email {
  id: number;
  from: string;
  subject: string;
  preview: string;
  date: string;
  isRead: boolean;
  avatar: string;
}

interface ComposeModel {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
}

@Component({
  selector: 'app-compose',
  templateUrl: './compose.html',
  styleUrls: ['./compose.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ComposeComponent implements OnInit {
  emails = signal<Email[]>([]);
  searchQuery = '';
  currentUser = signal<string>('');
  selectedEmail = signal<Email | null>(null);

  compose: ComposeModel = {
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
  };

  selectedFiles: File[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.currentUser.set(this.authService.getCurrentUser() || 'User');
  }

  ngOnInit(): void {}

  closeCompose(): void {
    try {
      window.history.length > 1 ? window.history.back() : this.router.navigateByUrl('/');
    } catch (e) {
      window.history.back();
    }
  }

  /** Handle file input change */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const incoming = Array.from(input.files);
    incoming.forEach(f => {
      const exists = this.selectedFiles.some(sf => sf.name === f.name && sf.size === f.size && sf.lastModified === f.lastModified);
      if (!exists) this.selectedFiles.push(f);
    });
  }

  removeAttachment(index: number): void {
    if (index >= 0 && index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
    }
  }

  /**
   * Send email (stub)
   */
  sendEmail(): void {
    if (!this.compose.to || !this.compose.body) {
      console.warn('Required fields missing: to/body');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.compose.to)) {
        console.warn('Invalid email format for "To" field');
        return;
    }

    const payload = {
      to: this.compose.to,
      cc: this.compose.cc,
      bcc: this.compose.bcc,
      subject: this.compose.subject,
      body: this.compose.body,
      attachments: this.selectedFiles.map(f => ({ name: f.name, size: f.size }))
    };

    this.http.post<any>('/api/send-email', payload).subscribe({
        next: res => {
        console.log('Email sent:', res);
        if (res?.previewUrl) {
            window.open(res.previewUrl, '_blank'); // Ethereal preview
        }
        this.closeCompose();
        },
        error: err => {
            console.error('Failed to send email', err);
            alert('Failed to send email');
        }
  });

    // After send, navigate back (or clear form). Here we go back to previous page.
    this.closeCompose();
  }

  saveDraft(): void {
    const draft = {
      ...this.compose,
      attachments: this.selectedFiles.map(f => ({ name: f.name, size: f.size }))
    };
    console.log('Saving draft (stub):', draft);
  }
}
