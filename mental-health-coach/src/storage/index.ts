import AsyncStorage from '@react-native-async-storage/async-storage';

export type Gender = 'female' | 'male' | 'other';
export interface UserProfile {
	fullName: string;
	gender: Gender;
	dateOfBirth: string; // ISO date string
	maritalStatus: 'single' | 'married' | 'other';
	employed: boolean;
	jobTitle?: string;
}

export interface AssessmentEntry {
	text: string;
	createdAt: string; // ISO datetime
}

export interface TestAnswer {
	questionId: string;
	value: number; // -2..+2 for Likert
}

export interface TestResult {
	answers: TestAnswer[];
	createdAt: string;
	score: number;
}

export interface AppState {
	language: string;
	user?: UserProfile;
	lastAIDiagnosisAt?: string;
}

const KEYS = {
	app: 'app_state',
	assessments: 'assessments',
	tests: 'tests',
	chatTranscript: 'chat_transcript',
};

export async function loadAppState(): Promise<AppState | null> {
	const raw = await AsyncStorage.getItem(KEYS.app);
	return raw ? JSON.parse(raw) : null;
}

export async function saveAppState(state: AppState): Promise<void> {
	await AsyncStorage.setItem(KEYS.app, JSON.stringify(state));
}

export async function saveAssessment(entry: AssessmentEntry): Promise<void> {
	const raw = await AsyncStorage.getItem(KEYS.assessments);
	const list: AssessmentEntry[] = raw ? JSON.parse(raw) : [];
	list.push(entry);
	await AsyncStorage.setItem(KEYS.assessments, JSON.stringify(list));
}

export async function saveTestResult(result: TestResult): Promise<void> {
	const raw = await AsyncStorage.getItem(KEYS.tests);
	const list: TestResult[] = raw ? JSON.parse(raw) : [];
	list.push(result);
	await AsyncStorage.setItem(KEYS.tests, JSON.stringify(list));
}

export async function appendChatMessage(msg: { role: 'user' | 'assistant'; content: string; timestamp: string; }): Promise<void> {
	const raw = await AsyncStorage.getItem(KEYS.chatTranscript);
	const list = raw ? JSON.parse(raw) : [];
	list.push(msg);
	await AsyncStorage.setItem(KEYS.chatTranscript, JSON.stringify(list));
}