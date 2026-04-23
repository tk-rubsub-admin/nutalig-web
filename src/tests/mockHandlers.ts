import { graphql } from 'msw';
import getCars from './mockData/getCars.json';
import getSubscriptions from './mockData/getSubscriptions.json';
import getAdditionalExpenses from './mockData/getAdditionalExpenses.json';
import getAdditionalExpenseById from './mockData/getAdditionalExpenseById.json';
import getCarModels from './mockData/getCarModels.json';
import searchSubscriptions from './mockData/searchSubscriptions.json';
import carModelById from './mockData/carModelById.json';

export const mockHandlers = [
  // ===========================================================================
  // EVme API
  // ===========================================================================
  graphql.query('GetCars', (_req, res, ctx) => {
    return res(ctx.data(getCars));
  }),

  graphql.query('GetAnyThingHereToFake', (_req, res, ctx) => {
    const fakeData = {
      name: ' Long',
      age: 20
    };
    return res(
      ctx.data({
        login: {
          fakeData
        }
      })
    );
  }),

  graphql.query('GetSubscriptions', (_req, res, ctx) => {
    return res(ctx.data(getSubscriptions));
  }),

  graphql.query('GetAdditionalExpenses', (_req, res, ctx) => {
    return res(ctx.data(getAdditionalExpenses));
  }),

  graphql.query('GetExpenseById', (_req, res, ctx) => {
    return res(ctx.data(getAdditionalExpenseById));
  }),

  graphql.query('GetCarModels', (_req, res, ctx) => {
    return res(ctx.data(getCarModels));
  }),

  graphql.query('CarModel', (_req, res, ctx) => {
    return res(ctx.data(carModelById));
  }),

  graphql.query('SearchSubscriptions', (_req, res, ctx) => {
    return res(ctx.data(searchSubscriptions));
  }),

  graphql.mutation('createCar', (_req, res, ctx) => {
    return res(
      ctx.data({
        createCar: {
          id: 'vjojfwe-fakeId'
        }
      })
    );
  }),

  graphql.mutation('addCarsToCarModel', (_req, res, ctx) => {
    return res(
      ctx.data({
        addCarsToCarModel: {
          id: 'vjojfwe-fakeId',
          brand: 'fake brand',
          model: 'fake model'
        }
      })
    );
  })
  // INFO: Keep this error for testing failed cases
  // return res(
  //   ctx.errors([
  //     {
  //       message: 'Fake error',
  //       errorType: 'FakeError',
  //     },
  //   ])
  // )
];
