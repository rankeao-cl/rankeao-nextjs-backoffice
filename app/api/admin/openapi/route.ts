import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

type ExplorerOperation = {
  operationId: string;
  method: string;
  path: string;
  summary: string;
  requiresAuth: boolean;
  queryParams: string[];
  pathParams: string[];
  tag?: string;
  hasRequestBody: boolean;
};

function extractPathParams(endpointPath: string): string[] {
  const matches = endpointPath.match(/\{([^}]+)\}/g) || [];
  return matches.map((value) => value.slice(1, -1));
}

function parseOperations(openApiYaml: string): ExplorerOperation[] {
  const lines = openApiYaml.split(/\r?\n/);

  const operations: ExplorerOperation[] = [];

  let currentPath = "";
  let current: ExplorerOperation | null = null;

  let inParameters = false;
  let currentParamName = "";
  let inTags = false;

  const finalize = () => {
    if (!current || !current.operationId) {
      current = null;
      inParameters = false;
      inTags = false;
      currentParamName = "";
      return;
    }

    const uniquePathParams = Array.from(new Set(extractPathParams(current.path)));
    const uniqueQueryParams = Array.from(
      new Set(current.queryParams.filter((param) => !uniquePathParams.includes(param)))
    );

    operations.push({
      ...current,
      pathParams: uniquePathParams,
      queryParams: uniqueQueryParams,
      summary: current.summary || current.operationId,
    });

    current = null;
    inParameters = false;
    inTags = false;
    currentParamName = "";
  };

  for (const rawLine of lines) {
    const indent = (rawLine.match(/^\s*/) || [""])[0].length;
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    if (indent === 2 && /^\/.*:$/.test(trimmed)) {
      finalize();
      currentPath = trimmed.slice(0, -1);
      continue;
    }

    const methodMatch = trimmed.match(/^(get|post|put|patch|delete|head|options):$/i);
    if (indent === 4 && methodMatch && currentPath) {
      finalize();
      current = {
        operationId: "",
        method: methodMatch[1].toUpperCase(),
        path: currentPath,
        summary: "",
        requiresAuth: false,
        queryParams: [],
        pathParams: [],
        hasRequestBody: false,
      };
      continue;
    }

    if (!current) {
      continue;
    }

    if (indent <= 4) {
      finalize();
      continue;
    }

    if (trimmed.startsWith("operationId:")) {
      current.operationId = trimmed.slice("operationId:".length).trim();
      continue;
    }

    if (trimmed.startsWith("summary:")) {
      current.summary = trimmed.slice("summary:".length).trim();
      continue;
    }

    if (trimmed.includes("BearerAuth")) {
      current.requiresAuth = true;
      continue;
    }

    if (trimmed === "requestBody:") {
      current.hasRequestBody = true;
      continue;
    }

    if (trimmed === "tags:") {
      inTags = true;
      continue;
    }

    if (inTags) {
      if (indent <= 6) {
        inTags = false;
      } else if (!current.tag) {
        const tagMatch = trimmed.match(/^-\s+(.+)$/);
        if (tagMatch) {
          current.tag = tagMatch[1].trim();
        }
      }
    }

    if (trimmed === "parameters:") {
      inParameters = true;
      currentParamName = "";
      continue;
    }

    if (inParameters) {
      if (indent <= 4) {
        inParameters = false;
        currentParamName = "";
        continue;
      }

      if (trimmed.startsWith("$ref:")) {
        if (trimmed.includes("/components/parameters/Page")) {
          current.queryParams.push("page");
        }
        if (trimmed.includes("/components/parameters/PerPage")) {
          current.queryParams.push("per_page");
        }
        continue;
      }

      const paramNameMatch = trimmed.match(/^-\s*name:\s*(.+)$/);
      if (paramNameMatch) {
        currentParamName = paramNameMatch[1].trim();
        continue;
      }

      const inMatch = trimmed.match(/^in:\s*(path|query|header|cookie)$/);
      if (inMatch && currentParamName) {
        if (inMatch[1] === "query") {
          current.queryParams.push(currentParamName);
        }
        currentParamName = "";
      }
    }
  }

  finalize();

  return operations.sort((a, b) => a.operationId.localeCompare(b.operationId));
}

export async function GET() {
  try {
    const openApiPath = path.join(process.cwd(), "admin-api.yaml");
    const rawYaml = await fs.readFile(openApiPath, "utf8");
    const operations = parseOperations(rawYaml);

    return NextResponse.json({
      operations,
      source: "admin-api.yaml",
      count: operations.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer admin-api.yaml";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
