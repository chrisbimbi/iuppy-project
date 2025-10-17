export interface Company {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  locations?: Location[];
  groups?: Group[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
}
