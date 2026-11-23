export interface Course {
  name: string;
  level: string;
  department: string;
  institution: string;
  role: string;
  terms: string;
}

export const teachingHeading = 'Teaching assistance experience';

export const courses: Course[] = [
  {
    name: 'Principles of Economics',
    level: 'Undergraduate course',
    department: 'Department of Economics',
    institution: 'Columbia University',
    role: 'Teaching assistant for Professor Sunil Gulati',
    terms:
      'Fall 2021 (Wueller Teaching Award, Runner up), Spring 2023 (Wueller Teaching Award, Runner up), Spring 2024',
  },
  {
    name: 'Introduction to Econometrics',
    level: 'Undergraduate course',
    department: 'Department of Economics',
    institution: 'Columbia University',
    role: 'Teaching assistant for Professor Tamrat Gashaw',
    terms: 'Fall 2022, Fall 2023',
  },
  {
    name: 'Global Economy',
    level: 'Undergraduate course',
    department: 'Department of Economics',
    institution: 'Columbia University',
    role: 'Teaching assistant for Professor Ronald Miller',
    terms: 'Spring 2022',
  },
];
