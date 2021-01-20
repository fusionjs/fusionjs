// @noflow
import { gql } from "fusion-plugin-apollo";
import { test } from "fusion-test-utils";
import { printSchema, buildASTSchema } from "graphql/utilities";
import { validate } from "graphql/validation";

test("test with gql macro", () => {
  const schema = buildASTSchema(gql("../schema.graphql"));
  const query = gql("../query.gql");
  expect(validate(schema, query)).toHaveLength(0);
  expect(printSchema(schema)).toMatchInlineSnapshot(`
"type Query {
  user: User
}

type User {
  firstName: String
}
"
`);
});
