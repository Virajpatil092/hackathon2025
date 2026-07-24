"""
Carbon Footprint Service Layer
Processes transaction data, maps MCC codes to carbon emissions, and provides analytics
"""

import csv
import json
from pathlib import Path
from typing import List, Dict, Optional
from collections import defaultdict
from datetime import datetime

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent


class CarbonFootprintService:
    """Service for calculating and analyzing carbon footprint from transactions"""
    
    def __init__(self):
        """Initialize service with MCC mapping data and cached analytics"""
        self.mcc_carbon_map = self._load_mcc_carbon_mapping()
        self.mcc_descriptions = self._load_mcc_descriptions()
        self.transactions_df = None
        
        # Cache containers
        self._cached_footprint = None
        self._cached_by_category = None
        self._cached_trend = None
        self._cached_distinct_mcc = None
        self._cached_mcc_by_category = None

        self._load_transactions()
    
    def _load_mcc_carbon_mapping(self) -> Dict[str, Dict]:
        """Load MCC to carbon emissions mapping from CSV using built-in csv module"""
        try:
            csv_path = PROJECT_ROOT / 'mcc_carbon_mapping_europe.csv'
            mapping = {}
            with open(csv_path, newline='', encoding='utf-8-sig') as handle:
                reader = csv.DictReader(handle)
                for row in reader:
                    mcc = str(row.get('MCC') or '').strip()
                    if mcc:
                        mapping[mcc] = {
                            'category': (row.get('High_Level_Category') or 'Other').strip(),
                            'emission_factor': float(row.get('Emission Factor (kgCO2e per EUR spent)') or 0.5)
                        }
            return mapping
        except Exception as e:
            print(f"Error loading MCC carbon mapping: {e}")
            return {}
    
    def _load_mcc_descriptions(self) -> Dict[str, str]:
        """Load MCC code descriptions from JSON"""
        try:
            json_path = PROJECT_ROOT / 'mcc_codes.json'
            with open(json_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading MCC descriptions: {e}")
            return {}
    
    def _parse_date(self, value: Optional[str]) -> Optional[datetime]:
        """Parse dates from the transaction CSV using a few common formats."""
        if not value:
            return None

        text = str(value).strip()
        if not text:
            return None

        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%m/%d/%Y", "%m/%d/%Y %H:%M:%S"):
            try:
                return datetime.strptime(text, fmt)
            except ValueError:
                continue

        try:
            return datetime.fromisoformat(text)
        except ValueError:
            return None

    def _coerce_amount(self, value) -> float:
        """Convert currency strings like '$40.35' to a float."""
        if value is None:
            return 0.0
        text = str(value).strip().replace('$', '').replace(',', '')
        if not text:
            return 0.0
        try:
            return float(text)
        except ValueError:
            return 0.0

    def _load_transactions(self):
        """Load and pre-parse transaction data for high performance."""
        try:
            csv_path = PROJECT_ROOT / 'customer_transaction_mcc_data.csv'
            with open(csv_path, newline='', encoding='utf-8-sig') as handle:
                reader = csv.DictReader(handle)
                rows = []
                for raw_row in reader:
                    raw_amount = raw_row.get('amount') or raw_row.get('Amount')
                    amount = self._coerce_amount(raw_amount)
                    
                    raw_date = (raw_row.get('date') or raw_row.get('Date') or '').strip()
                    parsed_date = self._parse_date(raw_date)
                    month_key = parsed_date.strftime('%Y-%m') if parsed_date else None
                    day = parsed_date.day if parsed_date else None
                    
                    mcc = (raw_row.get('mcc') or raw_row.get('MCC') or '').strip()
                    
                    rows.append({
                        'Amount': amount,
                        'Date': raw_date,
                        'ParsedDate': parsed_date,
                        'MonthKey': month_key,
                        'Day': day,
                        'MCC': mcc,
                    })

            self.transactions_df = rows
            print(f"Loaded {len(self.transactions_df)} transactions and pre-parsed metrics.")
        except Exception as e:
            print(f"Error loading transactions: {e}")
            self.transactions_df = None
    
    def get_distinct_mcc_codes(self) -> List[Dict]:
        """
        Get distinct MCC codes from transactions with their details and carbon mapping.
        Returns a list of dicts with MCC, description, category, emission_factor, and transaction count.
        """
        if self._cached_distinct_mcc is not None:
            return self._cached_distinct_mcc

        if not self.transactions_df:
            return []

        counts = defaultdict(int)
        for row in self.transactions_df:
            mcc = row['MCC']
            if mcc:
                counts[mcc] += 1

        distinct_mccs = []
        for mcc, count in sorted(counts.items()):
            carbon_info = self.mcc_carbon_map.get(mcc, {})
            description = self.mcc_descriptions.get(mcc, 'Unknown')
            distinct_mccs.append({
                'mcc_code': mcc,
                'description': description,
                'high_level_category': carbon_info.get('category', 'Other'),
                'emission_factor': carbon_info.get('emission_factor', 0.5),
                'transaction_count': int(count)
            })

        self._cached_distinct_mcc = distinct_mccs
        return distinct_mccs

    def get_mcc_by_category(self) -> Dict[str, List[Dict]]:
        """Group distinct MCCs by their high-level category."""
        if self._cached_mcc_by_category is not None:
            return self._cached_mcc_by_category

        categorized = defaultdict(list)
        for mcc_info in self.get_distinct_mcc_codes():
            categorized[mcc_info['high_level_category']].append(mcc_info)
        
        self._cached_mcc_by_category = dict(categorized)
        return self._cached_mcc_by_category

    def calculate_carbon_footprint(self) -> Dict:
        """Calculate total carbon footprint from all transactions (cached)."""
        if self._cached_footprint is not None:
            return self._cached_footprint

        if not self.transactions_df:
            return self._get_empty_footprint()

        category_totals = defaultdict(float)
        monthly_totals = defaultdict(float)
        monthly_category_totals = defaultdict(lambda: defaultdict(float))
        total_emissions = 0.0
        valid_transactions = 0

        for row in self.transactions_df:
            amount = row['Amount']
            if amount <= 0:
                continue

            mcc = row['MCC']
            carbon_info = self.mcc_carbon_map.get(mcc, {})
            emission_factor = carbon_info.get('emission_factor', 0.5)
            category = carbon_info.get('category', 'Other')
            co2e = amount * emission_factor

            category_totals[category] += co2e
            total_emissions += co2e
            valid_transactions += 1

            month_key = row['MonthKey']
            if month_key:
                monthly_totals[month_key] += co2e
                monthly_category_totals[month_key][category] += co2e

        # Dynamically set current month as the latest month in data
        sorted_months = sorted(monthly_totals.keys())
        if sorted_months:
            current_month = sorted_months[-1]
            previous_month = sorted_months[-2] if len(sorted_months) > 1 else current_month
        else:
            today = datetime.now()
            current_month = today.strftime('%Y-%m')
            previous_month = current_month

        current_month_total = monthly_totals.get(current_month, 0.0)
        previous_month_total = monthly_totals.get(previous_month, 0.0) if len(sorted_months) > 1 else 0.0

        vs_last_month = ((current_month_total - previous_month_total) / previous_month_total * 100) if previous_month_total > 0 else 0.0

        # Category breakdown for current month (or all-time fallback if current_month data unavailable)
        current_month_cats = monthly_category_totals.get(current_month, category_totals)
        breakdown_base_total = current_month_total if current_month in monthly_category_totals else total_emissions

        category_breakdown = [
            {
                'label': cat,
                'value': round((emissions / breakdown_base_total * 100) if breakdown_base_total > 0 else 0, 1),
                'kg': round(emissions, 2),
                'emission_factor': round(emissions, 2)
            }
            for cat, emissions in sorted(current_month_cats.items(), key=lambda item: item[1], reverse=True)
        ]

        six_month_trend = [
            {'month': month_key, 'value': round(monthly_totals[month_key], 2)}
            for month_key in sorted_months[-6:]
        ]

        # Calculate benchmarks
        benchmarks = self.get_carbon_benchmarks_for_footprint(current_month_total)
        vs_national_average = benchmarks['comparison']['vsNationalAverage']

        # Calculate weekly breakdown for the current month
        weekly_data = defaultdict(lambda: defaultdict(float))
        for wk in ['W1', 'W2', 'W3', 'W4']:
            for cat in ['transport', 'food', 'utilities', 'travel']:
                weekly_data[wk][cat] = 0.0

        for row in self.transactions_df:
            month_key = row['MonthKey']
            if month_key != current_month:
                continue

            amount = row['Amount']
            if amount <= 0:
                continue

            mcc = row['MCC']
            carbon_info = self.mcc_carbon_map.get(mcc, {})
            emission_factor = carbon_info.get('emission_factor', 0.5)
            category_lower = carbon_info.get('category', 'Other').lower()
            co2e = amount * emission_factor

            day = row['Day']
            if day is None:
                continue
            if day <= 7:
                wk = 'W1'
            elif day <= 14:
                wk = 'W2'
            elif day <= 21:
                wk = 'W3'
            else:
                wk = 'W4'

            if 'trans' in category_lower or 'fuel' in category_lower:
                sub_cat = 'transport'
            elif 'dine' in category_lower or 'food' in category_lower or 'grocer' in category_lower:
                sub_cat = 'food'
            elif 'util' in category_lower:
                sub_cat = 'utilities'
            else:
                sub_cat = 'travel'

            weekly_data[wk][sub_cat] += co2e

        weekly_breakdown = [
            {
                'week': wk,
                'transport': round(weekly_data[wk]['transport'], 2),
                'food': round(weekly_data[wk]['food'], 2),
                'utilities': round(weekly_data[wk]['utilities'], 2),
                'travel': round(weekly_data[wk]['travel'], 2)
            }
            for wk in ['W1', 'W2', 'W3', 'W4']
        ]

        result = {
            'kgThisMonth': round(current_month_total, 2),
            'kgLastMonth': round(previous_month_total, 2),
            'vsLastMonth': round(vs_last_month, 1),
            'vsNationalAverage': vs_national_average,
            'topEmissionCategory': category_breakdown[0]['label'] if category_breakdown else 'N/A',
            'categoryBreakdown': category_breakdown,
            'sixMonthTrend': six_month_trend,
            'totalEmissions': round(total_emissions, 2),
            'transactionCount': valid_transactions,
            'benchmarks': benchmarks,
            'weeklyBreakdown': weekly_breakdown
        }

        self._cached_footprint = result
        return result

    def get_carbon_by_category(self) -> Dict:
        """Get carbon emissions breakdown by category."""
        if self._cached_by_category is not None:
            return self._cached_by_category

        if not self.transactions_df:
            return {}

        category_groups = defaultdict(list)
        for row in self.transactions_df:
            amount = row['Amount']
            if amount <= 0:
                continue
            mcc = row['MCC']
            carbon_info = self.mcc_carbon_map.get(mcc, {})
            category = carbon_info.get('category', 'Other')
            emission_factor = carbon_info.get('emission_factor', 0.5)
            category_groups[category].append((amount, amount * emission_factor))

        result = {}
        for category, values in category_groups.items():
            total_spent = sum(value[0] for value in values)
            total_co2 = sum(value[1] for value in values)
            result[category] = {
                'totalCO2e': round(total_co2, 2),
                'avgCO2ePerTransaction': round(total_co2 / len(values), 2) if values else 0.0,
                'transactionCount': len(values),
                'totalSpent': round(total_spent, 2)
            }

        self._cached_by_category = result
        return result

    def get_carbon_trend(self, months: int = 6) -> List[Dict]:
        """Get carbon emissions trend over the last months."""
        if self._cached_trend is None:
            if not self.transactions_df:
                return []

            monthly_categories = defaultdict(lambda: defaultdict(float))
            for row in self.transactions_df:
                amount = row['Amount']
                if amount <= 0:
                    continue
                mcc = row['MCC']
                carbon_info = self.mcc_carbon_map.get(mcc, {})
                category = carbon_info.get('category', 'Other')
                emission_factor = carbon_info.get('emission_factor', 0.5)
                month_key = row['MonthKey']
                if not month_key:
                    continue
                monthly_categories[month_key][category] += amount * emission_factor

            trend_result = []
            for month_key in sorted(monthly_categories.keys()):
                trend_result.append({
                    'month': month_key,
                    'data': {cat: round(value, 2) for cat, value in monthly_categories[month_key].items()}
                })
            self._cached_trend = trend_result

        result = self._cached_trend
        return result[-months:] if len(result) > months else result
    
    def get_carbon_benchmarks_for_footprint(self, your_footprint: float) -> Dict:
        """Calculate carbon footprint benchmarks for a given footprint value"""
        return {
            'yourFootprint': round(your_footprint, 2),
            'nationalAverage': round(your_footprint * 1.34, 2),  # Assuming 34% above average
            'euTarget': round(your_footprint * 0.81, 2),  # EU average target
            'parisAgreementTarget': round(your_footprint * 0.69, 2),  # Stricter target
            'maxScale': round(max(your_footprint * 1.5, 1000), 0),
            'comparison': {
                'vsNationalAverage': round((your_footprint / (your_footprint * 1.34) - 1) * 100, 1) if your_footprint > 0 else 0.0,
                'vsEUTarget': round((your_footprint / (your_footprint * 0.81) - 1) * 100, 1) if your_footprint > 0 else 0.0,
                'vsParisTarget': round((your_footprint / (your_footprint * 0.69) - 1) * 100, 1) if your_footprint > 0 else 0.0
            }
        }

    def get_carbon_benchmarks(self) -> Dict:
        """Get carbon emissions benchmarks (individual vs averages)"""
        footprint = self.calculate_carbon_footprint()
        
        if not footprint:
            return {}
        
        your_footprint = footprint.get('kgThisMonth', 0)
        return self.get_carbon_benchmarks_for_footprint(your_footprint)
    
    def _get_empty_footprint(self) -> Dict:
        """Return empty footprint structure"""
        return {
            'kgThisMonth': 0,
            'kgLastMonth': 0,
            'vsLastMonth': 0,
            'vsNationalAverage': 0,
            'topEmissionCategory': 'N/A',
            'categoryBreakdown': [],
            'sixMonthTrend': [],
            'totalEmissions': 0,
            'transactionCount': 0,
            'benchmarks': self.get_carbon_benchmarks_for_footprint(0),
            'weeklyBreakdown': [
                {'week': wk, 'transport': 0, 'food': 0, 'utilities': 0, 'travel': 0}
                for wk in ['W1', 'W2', 'W3', 'W4']
            ]
        }


# Global service instance
_carbon_service: Optional[CarbonFootprintService] = None


def get_carbon_service() -> CarbonFootprintService:
    """Get or create the carbon footprint service instance"""
    global _carbon_service
    if _carbon_service is None:
        _carbon_service = CarbonFootprintService()
    return _carbon_service

