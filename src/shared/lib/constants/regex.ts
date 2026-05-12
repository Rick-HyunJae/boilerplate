export const locationReg = /^(https?:)\/\/(([^/:?#]*)(?::([0-9]+))?)([^?#]*)(\?[^#]*|)(#.*|)$/;

export const addCommaReg = /\B(?=(\d{3})+(?!\d))/g;

export const specialTextForNumberReg = /[^\d.-]/g;

export const koreanReg = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g;

export const englishReg = /[a-zA-Z]/g;

export const invalidStringNumericReg = /[^0-9.-]/;
