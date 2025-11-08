import { Kysely, MssqlDialect } from 'kysely';
import * as Tarn from 'tarn';
import * as Tedious from 'tedious';
import type { DB } from './types';

// Create the Kysely instance with MSSQL dialect
const dialect = new MssqlDialect({
  tarn: {
    ...Tarn,
    options: {
      min: 0,
      max: 10,
    },
  },
  tedious: {
    ...Tedious,
    connectionFactory: () =>
      new Tedious.Connection({
        server: process.env.DATABASE_HOST || 'localhost',
        authentication: {
          type: 'default',
          options: {
            userName: process.env.DATABASE_USER || '',
            password: process.env.DATABASE_PASSWORD || '',
          },
        },
        options: {
          port: parseInt(process.env.DATABASE_PORT || '1433'),
          database: process.env.DATABASE_NAME || '',
          trustServerCertificate: process.env.DATABASE_TRUST_SERVER_CERTIFICATE === 'true',
          encrypt: process.env.DATABASE_ENCRYPT === 'true',
          // Useful for Azure SQL
          // connectTimeout: 30000,
          // requestTimeout: 30000,
        },
      }),
  },
});

// Export the database instance
export const db = new Kysely<DB>({
  dialect,
  // Uncomment to log queries in development
  // log(event) {
  //   if (event.level === 'query') {
  //     console.log(event.query.sql);
  //     console.log(event.query.parameters);
  //   }
  // },
});
