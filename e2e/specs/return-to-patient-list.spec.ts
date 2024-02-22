import { test } from '../core';
import { HomePage, PatientListsPage } from '../pages';
import { expect } from '@playwright/test';
import {
  type Cohort,
  type CohortMember,
  type Patient,
  addPatientToCohort,
  deleteCohort,
  deletePatient,
  generateRandomCohort,
  generateRandomPatient,
  removePatientFromCohort,
} from '../commands';

let createdCohortMember: CohortMember;
let createdCohortUuid: string;
let cohort: Cohort;
let patient: Patient;

test.beforeEach(async ({ api }) => {
  patient = await generateRandomPatient(api);
  cohort = await generateRandomCohort(api);
  createdCohortMember = await addPatientToCohort(api, cohort.uuid, patient.uuid);
});

test('Return to patient list from the patient chart', async ({ page }) => {
  const homePage = new HomePage(page);
  const patientListPage = new PatientListsPage(page);
  await test.step('When I navigate to the patient list', async () => {
    await patientListPage.goto(cohort.uuid);
  });

  await test.step('And I click on the patient {{name}} in the list', async () => {
    await page.locator('table tbody tr td:nth-child(1) a').click();
  });

  await test.step('Then I should be redirected to the patient chart', async () => {
    await expect(homePage.page).toHaveURL(
      `${process.env.E2E_BASE_URL}/spa/patient/${patient.uuid}/chart/Patient Summary`,
    );
  });

  await test.step('When I click on the `Close` button', async () => {
    await page.getByRole('button', { name: 'Close' }).click();
  });

  await test.step('Then I should be redirected back to the patient list', async () => {
    await expect(page).toHaveURL(/.*patient-lists/);
    await expect(patientListPage.patientListHeader()).toHaveText(/1 patients/);
    await expect(patientListPage.patientsTable()).toHaveText(new RegExp(patient.person.display));
  });
});

test('Return to patient list after navigating to visits page from the patient chart', async ({ page }) => {
  const homePage = new HomePage(page);
  const patientListPage = new PatientListsPage(page);
  await test.step('When I navigate to the patient list', async () => {
    await patientListPage.goto(cohort.uuid);
  });

  await test.step('And I click on the patient {{name}} in the list', async () => {
    await page.locator('table tbody tr td:nth-child(1) a').click();
  });

  await test.step('Then I should be redirected to the patient chart', async () => {
    await expect(homePage.page).toHaveURL(
      `${process.env.E2E_BASE_URL}/spa/patient/${patient.uuid}/chart/Patient Summary`,
    );
  });

  await test.step('When I click on the `Open menu` button', async () => {
    await page.getByLabel('Open menu').click();
  });

  await test.step('And I click on the `Visits` link', async () => {
    await page.getByRole('link', { name: 'Visits' }).click();
  });

  await test.step('And I click on the `Close` button', async () => {
    await page.getByRole('button', { name: 'Close' }).click();
  });

  await test.step('Then I should be redirected back to the patient list', async () => {
    await expect(page).toHaveURL(/.*patient-lists/);
    await expect(patientListPage.patientListHeader()).toHaveText(/1 patients/);
    await expect(patientListPage.patientsTable()).toHaveText(new RegExp(patient.person.display));
  });
});

test('Return to patient list after navigating to visits and refreshing the page', async ({ page }) => {
  const homePage = new HomePage(page);
  const patientListPage = new PatientListsPage(page);
  await test.step('When I navigate to the patient list', async () => {
    await patientListPage.goto(cohort.uuid);
  });

  await test.step('And I click on the patient {{name}} in the list', async () => {
    await page.locator('table tbody tr td:nth-child(1) a').click();
  });

  await test.step('Then I should be redirected to the patient chart', async () => {
    await expect(homePage.page).toHaveURL(
      `${process.env.E2E_BASE_URL}/spa/patient/${patient.uuid}/chart/Patient Summary`,
    );
  });

  await test.step('When I click on the `Open menu` button', async () => {
    await page.getByLabel('Open menu').click();
  });

  await test.step('And I click on the `Visits` link', async () => {
    await page.getByRole('link', { name: 'Visits' }).click();
  });

  await test.step('And I refesh the page', async () => {
    await page.reload();
  });

  await test.step('And I click on the `Close` button', async () => {
    await page.getByRole('button', { name: 'Close' }).click();
  });

  await test.step('Then I should be redirected back to the patient list', async () => {
    await expect(page).toHaveURL(/.*patient-lists/);
    await expect(patientListPage.patientListHeader()).toHaveText(/1 patients/);
    await expect(patientListPage.patientsTable()).toHaveText(new RegExp(patient.person.display));
  });
});

test('Return to patient list from the patient chart on a new tab', async ({ page, context }) => {
  const homePage = new HomePage(page);
  const patientListPage = new PatientListsPage(page);
  const locator = await page.locator('table tbody tr td:nth-child(1) a');
  const pagePromise = context.waitForEvent('page');
  await test.step('When I navigate to the patient list', async () => {
    await patientListPage.goto(cohort.uuid);
  });

  await test.step('And I open the patient link in a new tab', async () => {
    await locator.click({ button: 'middle' });
  });

  let newPage = await pagePromise;
  await newPage.bringToFront();

  await test.step('Then I should be redirected to the patient chart', async () => {
    await expect(newPage).toHaveURL(`${process.env.E2E_BASE_URL}/spa/patient/${patient.uuid}/chart/Patient Summary`);
  });

  await test.step('When I click on the `Close` button', async () => {
    await newPage.getByRole('button', { name: 'Close' }).click();
  });

  await test.step('Then I should be redirected back to the patient list', async () => {
    await expect(newPage).toHaveURL(/.*patient-lists/);
    await expect(patientListPage.patientListHeader()).toHaveText(/1 patients/);
    await expect(patientListPage.patientsTable()).toHaveText(new RegExp(patient.person.display));
  });

  await test.step('And I should have two tabs on the patient list', async () => {
    await expect(newPage).toHaveURL(/.*patient-lists/);
    await expect(patientListPage.patientListHeader()).toHaveText(/1 patients/);
    await expect(patientListPage.patientsTable()).toHaveText(new RegExp(patient.person.display));
    await page.bringToFront();
    await expect(page).toHaveURL(/.*patient-lists/);
    await expect(patientListPage.patientListHeader()).toHaveText(/1 patients/);
    await expect(patientListPage.patientsTable()).toHaveText(new RegExp(patient.person.display));
  });
});

test.afterEach(async ({ api }) => {
  if (createdCohortMember) {
    await removePatientFromCohort(api, createdCohortMember.uuid);
  }
  if (createdCohortUuid) {
    await deleteCohort(api, createdCohortUuid);
  }
  await deletePatient(api, patient.uuid);
  await deleteCohort(api, cohort.uuid);
});
