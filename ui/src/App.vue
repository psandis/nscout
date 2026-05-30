<template>
  <div class="app">
    <header>
      <h1>nscout</h1>
      <p>Scout a name across registries before you commit to it.</p>
    </header>

    <main>
      <section class="input-section">
        <div class="name-row">
          <input
            v-model="nameInput"
            placeholder="myapp mytool myproject"
            @keydown.enter="check"
          />
          <button @click="check" :disabled="loading">
            {{ loading ? "Checking..." : "Check" }}
          </button>
        </div>

        <div class="registries">
          <label v-for="r in allRegistries" :key="r">
            <input type="checkbox" :value="r" v-model="selectedRegistries" />
            {{ r }}
          </label>
        </div>

        <div class="domains" v-if="selectedRegistries.includes('domains')">
          <input v-model="domainInput" placeholder=".com,.dev,.io,.sh" />
        </div>
      </section>

      <section class="results" v-if="results.length > 0">
        <table>
          <thead>
            <tr>
              <th>name</th>
              <th v-for="reg in columns" :key="reg">{{ reg }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in results" :key="row.name">
              <td class="name">{{ row.name }}</td>
              <td
                v-for="reg in columns"
                :key="reg"
                :class="statusClass(getStatus(row, reg))"
                :title="getDetail(row, reg)"
              >
                {{ symbols[getStatus(row, reg)] ?? "-" }}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="legend">
          ✓ available &nbsp; ✗ taken &nbsp; ⚠ reserved &nbsp; ⏳ expiring &nbsp; ? unknown &nbsp; ! error
        </div>
      </section>

      <div class="error" v-if="error">{{ error }}</div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface CheckResult {
  registry: string;
  status: string;
  detail?: string;
}

interface NameResult {
  name: string;
  checks: CheckResult[];
}

const nameInput = ref("");
const domainInput = ref(".com,.dev,.io,.sh");
const allRegistries = ["npm", "github", "pypi", "dockerhub", "domains"];
const selectedRegistries = ref([...allRegistries]);
const results = ref<NameResult[]>([]);
const loading = ref(false);
const error = ref("");

const symbols: Record<string, string> = {
  available: "✓",
  taken:     "✗",
  reserved:  "⚠",
  expiring:  "⏳",
  unknown:   "?",
  error:     "!",
};

const columns = computed(() => {
  const seen = new Set<string>();
  const cols: string[] = [];
  for (const row of results.value) {
    for (const check of row.checks) {
      if (!seen.has(check.registry)) {
        seen.add(check.registry);
        cols.push(check.registry);
      }
    }
  }
  return cols;
});

function getCheck(row: NameResult, registry: string): CheckResult | undefined {
  return row.checks.find((c) => c.registry === registry);
}

function getStatus(row: NameResult, registry: string): string {
  return getCheck(row, registry)?.status ?? "-";
}

function getDetail(row: NameResult, registry: string): string {
  return getCheck(row, registry)?.detail ?? "";
}

function statusClass(status: string): string {
  return `status-${status}`;
}

async function check() {
  const names = nameInput.value.trim().split(/\s+/).filter(Boolean);
  if (names.length === 0) return;

  loading.value = true;
  error.value = "";
  results.value = [];

  try {
    const res = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        names,
        registries: selectedRegistries.value,
        domains: domainInput.value.split(",").map((d: string) => d.trim()).filter(Boolean),
      }),
    });

    if (!res.ok) {
      const data = await res.json() as { error: string };
      error.value = data.error;
      return;
    }

    results.value = await res.json() as NameResult[];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Request failed";
  } finally {
    loading.value = false;
  }
}
</script>

