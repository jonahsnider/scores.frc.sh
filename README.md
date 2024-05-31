# scores.frc.sh - Top FRC scores

**[scores.frc.sh](https://scores.frc.sh)**

A web app that displays the progression of the top scores in FRC games over time.

![Screenshot of website](./website.png)

## Development

The frontend of scores.frc.sh was built with [Next.js](https://nextjs.org/) and uses [Radix Themes](https://www.radix-ui.com/) and [Tailwind CSS](https://tailwindcss.com/) for styling.

The backend API is built in TypeScript using the [NestJS framework](https://nestjs.com/).
[tRPC](https://trpc.io/) is used to facilitate RPC between the frontend and the backend.

For storage, a PostgreSQL database is used via [Drizzle ORM](https://orm.drizzle.team/) for persisting data.
A Redis instance is used as a job queue for [BullMQ](https://bullmq.io/) workers that fetch data from the FIRST and TBA APIs, process it, and then persist it in the database.
