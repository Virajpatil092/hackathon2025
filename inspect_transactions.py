import pandas as pd
from pathlib import Path
p = Path('customer_transaction_mcc_data.csv')
df = pd.read_csv(p)
print(df.columns.tolist())
print(df.head(3).to_string())
