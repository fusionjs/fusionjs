import {
  FetchToken,
  SessionToken,
  LoggerToken,
  CacheToken,
} from "../src/index";

test("fusion-tokens exports", () => {
  expect(FetchToken).toBeTruthy();
  expect(SessionToken).toBeTruthy();
  expect(LoggerToken).toBeTruthy();
  expect(CacheToken).toBeTruthy();
});
