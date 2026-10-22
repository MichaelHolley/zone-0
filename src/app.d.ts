declare global {
	namespace App {
		interface Error {
			message: string;
			code?: 'GARMIN_KEY_INVALID';
		}
	}
}

export {};
