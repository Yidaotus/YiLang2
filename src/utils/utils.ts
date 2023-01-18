export const filterUndefined = <T>(v: T | undefined): v is T => {
	return v !== undefined;
};

export const filterNullish = <T>(v: T | undefined | null): v is T => {
	return v !== undefined && v !== null;
};
