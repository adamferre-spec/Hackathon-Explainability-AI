from pathlib import Path
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RAW_FILE = DATA_DIR / "WA_Fn-UseC_-HR-Employee-Attrition.csv"
OUT_FILE = DATA_DIR / "HR_IBM_anonymised.csv"

DROP_COLUMNS = ["EmployeeNumber", "EmployeeCount", "StandardHours", "Over18"]


def age_to_group(age: float) -> str:
    if age < 25:
        return "<25"
    if age < 35:
        return "25-34"
    if age < 45:
        return "35-44"
    if age < 55:
        return "45-54"
    return "55+"


def main() -> None:
    if not RAW_FILE.exists():
        raise FileNotFoundError(
            f"CSV source introuvable: {RAW_FILE}. Placez WA_Fn-UseC_-HR-Employee-Attrition.csv dans data/."
        )

    df = pd.read_csv(RAW_FILE)

    before_rows, before_cols = df.shape

    if "Age" in df.columns:
        df["AgeGroup"] = df["Age"].apply(age_to_group)
        df = df.drop(columns=["Age"])

    existing_drop = [column for column in DROP_COLUMNS if column in df.columns]
    if existing_drop:
        df = df.drop(columns=existing_drop)

    if "Attrition" not in df.columns:
        raise ValueError("Colonne cible 'Attrition' absente du dataset source.")

    df["Attrition"] = df["Attrition"].map({"Yes": 1, "No": 0}).astype(int)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_FILE, index=False)

    after_rows, after_cols = df.shape
    print("✅ Step1 terminé")
    print(f"- Input : {before_rows} lignes, {before_cols} colonnes")
    print(f"- Output: {after_rows} lignes, {after_cols} colonnes")
    print(f"- Fichier généré: {OUT_FILE}")


if __name__ == "__main__":
    main()
