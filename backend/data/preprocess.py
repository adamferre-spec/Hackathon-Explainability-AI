import hashlib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import StandardScaler

# Features sélectionnées (top 40 par importance RF)
SELECTED_FEATURES = [
    "Flow Duration", "Total Fwd Packets", "Total Backward Packets",
    "Total Length of Fwd Packets", "Total Length of Bwd Packets",
    "Fwd Packet Length Max", "Fwd Packet Length Min", "Fwd Packet Length Mean",
    "Bwd Packet Length Max", "Bwd Packet Length Min", "Bwd Packet Length Mean",
    "Flow Bytes/s", "Flow Packets/s", "Flow IAT Mean", "Flow IAT Std",
    "Fwd IAT Mean", "Fwd IAT Std", "Bwd IAT Mean", "Bwd IAT Std",
    "Fwd PSH Flags", "Bwd PSH Flags", "Fwd URG Flags", "Bwd URG Flags",
    "Fwd Header Length", "Bwd Header Length", "Fwd Packets/s", "Bwd Packets/s",
    "Packet Length Min", "Packet Length Max", "Packet Length Mean",
    "Packet Length Std", "Packet Length Variance", "FIN Flag Count",
    "SYN Flag Count", "RST Flag Count", "PSH Flag Count", "ACK Flag Count",
    "URG Flag Count", "Average Packet Size", "Avg Fwd Segment Size",
]

LABEL_MAP = {
    "BENIGN": 0, "DDoS": 1, "PortScan": 2, "Bot": 3,
    "FTP-Patator": 4, "SSH-Patator": 4,
    "Web Attack \x96 Brute Force": 5, "Web Attack \x96 XSS": 5,
    "Web Attack \x96 Sql Injection": 5, "Infiltration": 6,
}
CLASS_NAMES = ["BENIGN", "DDoS", "PortScan", "Bot", "Brute Force", "Web Attack", "Infiltration"]

SALT = "cyberguard2026"


def anonymize_ip(ip: str) -> str:
    return hashlib.sha256(f"{SALT}{ip}".encode()).hexdigest()[:16]


def load_and_clean(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path, low_memory=False)
    df.columns = df.columns.str.strip()

    # Anonymiser les IPs si présentes
    for col in [" Source IP", " Destination IP", "Source IP", "Destination IP"]:
        if col in df.columns:
            df[col] = df[col].apply(anonymize_ip)

    # Garder seulement les features + label
    label_col = " Label" if " Label" in df.columns else "Label"
    available = [f for f in SELECTED_FEATURES if f in df.columns]
    df = df[available + [label_col]].copy()
    df = df.rename(columns={label_col: "label"})

    # Nettoyer
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.fillna(df.median(numeric_only=True), inplace=True)

    # Mapper les labels
    df["label"] = df["label"].str.strip().map(LABEL_MAP).fillna(0).astype(int)

    return df


def preprocess(csv_paths: list, output_dir: str = "data/processed"):
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    frames = [load_and_clean(p) for p in csv_paths]
    df = pd.concat(frames, ignore_index=True)

    features = [f for f in SELECTED_FEATURES if f in df.columns]
    X = df[features].values
    y = df["label"].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Sauvegarder
    pd.DataFrame(X_scaled, columns=features).to_parquet(f"{output_dir}/X.parquet", index=False)
    pd.Series(y, name="label").to_frame().to_parquet(f"{output_dir}/y.parquet", index=False)

    import joblib
    joblib.dump(scaler, f"{output_dir}/scaler.pkl")
    joblib.dump(features, f"{output_dir}/features.pkl")

    print(f"✅ Preprocessed {len(df):,} rows | Classes: {dict(zip(*np.unique(y, return_counts=True)))}")
    return X_scaled, y, scaler, features
