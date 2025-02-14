type ValidateResult = { result: true } | { result: false; message: string };

export class Validator {
  static validateUserName(name: string): ValidateResult {
    if (name.length === 0 || name.length > 50) {
      return {
        result: false,
        message: "이름은 1자 이상 50자 이하로 입력해주세요.",
      };
    }

    const nameRegex = /^[가-힣a-zA-Z ]+$/;
    if (!nameRegex.test(name)) {
      return {
        result: false,
        message: "이름은 한글, 영문, 공백만 입력 가능합니다.",
      };
    }

    return { result: true };
  }

  static validateGrade(grade: number): ValidateResult {
    if (Number.isNaN(grade)) {
      return {
        result: false,
        message: "학년은 숫자로 입력해주세요.",
      };
    }

    if (grade < 1 || grade > 10) {
      return {
        result: false,
        message: "학년은 1 이상 4 이하로 입력해주세요.",
      };
    }

    return { result: true };
  }
}
