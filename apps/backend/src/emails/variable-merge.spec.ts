import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergeUserVariableOverrides,
  type VariableSchemaRoot,
} from "@madoo/shared";

const BASE_CODE = `const Email = ({
  logoUrl = 'https://cdn.example.com/original-logo.png',
  monthLabel = 'June',
} = {}) => (<div />);
export default Email;
`;

// User replaced the logo via the variables panel: the stored schema carries
// the uploaded URL while the code default still holds the original.
const USER_SCHEMA: VariableSchemaRoot = {
  variables: [
    {
      name: "logoUrl",
      default: "https://bucket.s3.amazonaws.com/email-images/upload.png",
      role: "image",
      scope: "static",
    },
    { name: "monthLabel", default: "June", role: "text", scope: "dynamic" },
  ],
};

describe("mergeUserVariableOverrides", () => {
  it("restores a user-uploaded value the model reverted to the code default", () => {
    const emitted: VariableSchemaRoot = {
      variables: [
        {
          name: "logoUrl",
          default: "https://cdn.example.com/original-logo.png",
          role: "image",
          scope: "static",
        },
        { name: "monthLabel", default: "June", role: "text", scope: "dynamic" },
      ],
    };
    const merged = mergeUserVariableOverrides(emitted, BASE_CODE, USER_SCHEMA);
    assert.equal(
      merged.variables[0].default,
      "https://bucket.s3.amazonaws.com/email-images/upload.png",
    );
    assert.equal(merged.variables[1].default, "June");
  });

  it("keeps a value the model changed deliberately", () => {
    const emitted: VariableSchemaRoot = {
      variables: [
        {
          name: "logoUrl",
          default: "https://cdn.example.com/brand-new-logo.png",
          role: "image",
          scope: "static",
        },
      ],
    };
    const merged = mergeUserVariableOverrides(emitted, BASE_CODE, USER_SCHEMA);
    assert.equal(
      merged.variables[0].default,
      "https://cdn.example.com/brand-new-logo.png",
    );
  });

  it("leaves variables without user overrides untouched", () => {
    const emitted: VariableSchemaRoot = {
      variables: [
        { name: "monthLabel", default: "July", role: "text", scope: "dynamic" },
        { name: "brandName", default: "Shimli", role: "text", scope: "static" },
      ],
    };
    const merged = mergeUserVariableOverrides(emitted, BASE_CODE, USER_SCHEMA);
    assert.equal(merged.variables[0].default, "July");
    assert.equal(merged.variables[1].default, "Shimli");
  });

  it("survives a malformed stored schema", () => {
    const emitted: VariableSchemaRoot = {
      variables: [
        { name: "logoUrl", default: "x", role: "image", scope: "static" },
      ],
    };
    const merged = mergeUserVariableOverrides(emitted, BASE_CODE, {
      totally: "broken",
    });
    assert.deepEqual(merged, emitted);
  });
});
