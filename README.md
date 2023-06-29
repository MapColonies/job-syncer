# Job Syncer Service
The Job Syncer service is responsible for updating the status and progress of jobs, as well as finalizing them when they are completed. It operates as a cron job that periodically retrieves all jobs in the "in-progress" state and updates their progress based on the assigned tasks.

## Functionality
Updating Job Progress: The Job Syncer service retrieves all jobs in the "in-progress" state and updates their progress, typically represented as a percentage. This progress indicates the completion level of the tasks associated with each job.

Job Finalization: When all tasks associated with a job have been completed (i.e., there are no remaining "in-progress" tasks), the Job Syncer service performs the following actions:

a. Calls Catalog Service: The service communicates with the Catalog service, providing it with the metadata of the model associated with the job. This step ensures that the Catalog service has the necessary information to process the completed job successfully.

b. Sets Job State to "Completed": After successfully interacting with the Catalog service, the Job Syncer service sets the job's state to "completed". This indicates that all tasks have been finished, and the job is ready for further processing or evaluation.

Handling Failed Tasks: If any of the tasks associated with a job have failed, the Job Syncer service promptly identifies this situation and handles it accordingly:

a. Failing the Job: In case of a failed task, the Job Syncer service marks the entire job as failed. This action alerts the relevant stakeholders that the job could not be successfully completed and requires further attention or intervention.

## Dependencies
The Job Syncer service relies on the following components:

Job Manager: The service assumes the existence of a job manager service that tracks job states and task progress.
Catalog Service: The Catalog service is required for finalizing jobs. It receives metadata about the model associated with each completed job.

## Configuration
The Job Syncer service may require the following configuration options:

Job manager API: Provide the necessary API endpoints or credentials to connect to the job manager service and retrieve job and task information.
Catalog Service API: Configure the API endpoints or credentials required to interact with the Catalog service and provide the metadata for completed jobs.

## Installation

Install deps with npm

```bash
npm install
```
### Install Git Hooks
```bash
npx husky install
```

## Run Locally

Clone the project

```bash

git clone https://github.com/MapColonies/3d-job-syncer.git

```

Go to the project directory

```bash

cd 3d-job-syncer

```

Install dependencies

```bash

npm install

```

Start the script

```bash

npm start

```

## Running Tests

To run tests, run the following command

```bash

npm run test

```

To only run unit tests:
```bash
npm run test:unit
```

To only run integration tests:
```bash
npm run test:integration
```
