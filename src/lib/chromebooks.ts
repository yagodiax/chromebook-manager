import { Chromebook } from "@/types/chromebook";

const STORAGE_KEY = "chromebook-manager";

export function getChromebooks(): Chromebook[] {
if (typeof window === "undefined") {
return [];
}

const data = localStorage.getItem(STORAGE_KEY);

if (!data) {
return [];
}

try {
return JSON.parse(data);
} catch {
return [];
}
}

export function saveChromebook(
chromebook: Chromebook
): void {
const chromebooks = getChromebooks();

const updatedChromebooks = [
...chromebooks,
chromebook,
];

localStorage.setItem(
STORAGE_KEY,
JSON.stringify(updatedChromebooks)
);
}

export function deleteChromebook(id: string): void {
const chromebooks = getChromebooks();

const updatedChromebooks = chromebooks.filter(
(chromebook) => chromebook.id !== id
);

localStorage.setItem(
STORAGE_KEY,
JSON.stringify(updatedChromebooks)
);
}

export function updateChromebook(
updatedChromebook: Chromebook
): void {
const chromebooks = getChromebooks();

const updatedChromebooks = chromebooks.map(
(chromebook) =>
chromebook.id === updatedChromebook.id
? updatedChromebook
: chromebook
);

localStorage.setItem(
STORAGE_KEY,
JSON.stringify(updatedChromebooks)
);
}
