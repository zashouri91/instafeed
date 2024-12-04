export type Role = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  locationId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Survey {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  questions: Question[];
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  type: 'rating' | 'yesno' | 'nps' | 'text' | 'multipleChoice';
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  order: number;
}