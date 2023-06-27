# JobSyncer Service
The JobSyncer service is responsible for updating the status and progress of jobs, as well as finalizing them when they are completed. It operates as a cron job that periodically retrieves all jobs in the "in-progress" state and updates their progress based on the assigned tasks.

## Functionality
Updating Job Progress: The JobSyncer service retrieves all jobs in the "in-progress" state and updates their progress, typically represented as a percentage. This progress indicates the completion level of the tasks associated with each job.

Job Finalization: When all tasks associated with a job have been completed (i.e., there are no remaining "in-progress" tasks), the JobSyncer service performs the following actions:

a. Calls Catalog Service: The service communicates with the Catalog service, providing it with the metadata of the model associated with the job. This step ensures that the Catalog service has the necessary information to process the completed job successfully.

b. Sets Job State to "Completed": After successfully interacting with the Catalog service, the JobSyncer service sets the job's state to "completed". This indicates that all tasks have been finished, and the job is ready for further processing or evaluation.

Handling Failed Tasks: If any of the tasks associated with a job have failed, the JobSyncer service promptly identifies this situation and handles it accordingly:

a. Failing the Job: In case of a failed task, the JobSyncer service marks the entire job as failed. This action alerts the relevant stakeholders that the job could not be successfully completed and requires further attention or intervention.

## Usage
To use the JobSyncer service effectively, follow these steps:

Configure the cron job: Set up a cron job that runs the JobSyncer service at regular intervals. This ensures that job updates and finalization occur in a timely manner.

Ensure job states: Ensure that your job management system has appropriate states, such as "in-progress," "completed," and "failed," to facilitate the synchronization and finalization processes.

Implement job status updates: Develop functionality within the JobSyncer service to retrieve and update the progress of jobs in the "in-progress" state. This involves iterating through each job, tracking the progress of associated tasks, and updating the job progress accordingly.

Handle job finalization: Implement the necessary logic to detect when all tasks for a job are completed. Upon reaching this state, initiate the finalization process, which involves interacting with the Catalog service and setting the job state to "completed."

Manage failed tasks: Implement error handling mechanisms to identify failed tasks within a job. When a failed task is detected, mark the entire job as failed and notify the relevant stakeholders.

Monitor and troubleshoot: Regularly monitor the JobSyncer service for any issues or failures. Ensure that appropriate logging and error handling mechanisms are in place to aid in troubleshooting and resolving any potential issues.

## Dependencies
The JobSyncer service relies on the following components:

Job Management System: The service assumes the existence of a job management system that tracks job states and task progress.
Catalog Service: The Catalog service is required for finalizing jobs. It receives metadata about the model associated with each completed job.
Cron Scheduler: A cron job scheduler is necessary to execute the JobSyncer service at regular intervals.

## Configuration
The JobSyncer service may require the following configuration options:

Job Management System API: Provide the necessary API endpoints or credentials to connect to the job management system and retrieve job and task information.
Catalog Service API: Configure the API endpoints or credentials required to interact with the Catalog service and provide the metadata for completed jobs.
Cron Job Schedule: Set the

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

npm run start -- [parameter1] [parameter 2] [...]

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
