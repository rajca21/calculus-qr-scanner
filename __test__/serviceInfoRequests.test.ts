import axios from 'axios';
import { getDateTimeDBServer, getDateTimeWebServer } from '@/lib/calculusWS/serviceInfoRequests';

jest.mock('axios');
const get = axios.get as jest.MockedFunction<typeof axios.get>;

describe('startup connection checks', () => {
  beforeEach(() => jest.resetAllMocks());

  it('reports a working web server and limits request duration', async () => {
    get.mockResolvedValue({ status: 200 });
    await expect(getDateTimeWebServer()).resolves.toBe(true);
    expect(get).toHaveBeenCalledWith(expect.stringMatching(/\/ws$/), { timeout: 15000 });
  });

  it('reports a working database and limits request duration', async () => {
    get.mockResolvedValue({ status: 200 });
    await expect(getDateTimeDBServer()).resolves.toBe(true);
    expect(get).toHaveBeenCalledWith(expect.stringMatching(/\/db$/), { timeout: 15000 });
  });

  it('reports a network failure without rejecting the startup flow', async () => {
    get.mockRejectedValue(new Error('Network unavailable'));
    await expect(getDateTimeWebServer()).resolves.toBe(false);
    await expect(getDateTimeDBServer()).resolves.toBe(false);
  });

  it('reports an unavailable service on a non-success response', async () => {
    get.mockResolvedValue({ status: 503 });
    await expect(getDateTimeWebServer()).resolves.toBe(false);
    await expect(getDateTimeDBServer()).resolves.toBe(false);
  });
});
