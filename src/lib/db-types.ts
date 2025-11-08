import type { Selectable, Insertable, Updateable } from 'kysely';
import type { TblContacten } from './types';

// User types from tbl_Contacten
export type User = Selectable<TblContacten>;
export type NewUser = Insertable<TblContacten>;
export type UserUpdate = Updateable<TblContacten>;
