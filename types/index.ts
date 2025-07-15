// types/index.ts
export type Industry = {
	id: number;
	name: string;
  };

export type Seminar = {
	id: string;
	created_at: string;
	title: string;
	banner_url: string;
	description: string;
	line_url: string;
	online: boolean;
	host_id: string;
	is_recommend?: boolean;
	industry_id?: number | null;
	users?: {
	  id: string;
	  name: string;
	};
	industries?: {
		name: string;
	  };
  };
  
  

  export type Shift = {
	id: string;
	seminar_id: string;
	staff_name: string;
	shift_date: string;
	created_at: string;
	shift_time?: string | null;
	status: '申' | '済' | '削'; 
	seminars?: {
	  title: string;
	} | null;
  };

export type User = {
  id: string;
  name: string;
  furigana: string;
  company: string;
  email: string;
  password: string;
  password_plain: string;
  status: string;
  created_at: string;
};

// types.ts に追記
export type SeminarFromDB = {
	id: string;
	created_at: string;
	title: string;
	description: string;
	banner_url: string;
	line_url: string;
	online: boolean;
	is_recommend: boolean;
	host_id: string;
	industry_id: string;
	users: {
	  name: string;
	};
	industries: {
	  name: string;
	};
  };
  