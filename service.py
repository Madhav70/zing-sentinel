import requests

API_KEY = "YOUR_API_KEY"

def get_live_rate(from_currency, to_currency):
    # Dummy rates in case API fails or key is missing
    fallback_rates = {
        ("USD", "INR"): 82.5,
        ("INR", "USD"): 0.012,
        ("USD", "EUR"): 0.92,
        ("EUR", "USD"): 1.09,
    }

    if API_KEY != "YOUR_API_KEY":
        try:
            url = f"https://v6.exchangerate-api.com/v6/{API_KEY}/latest/{from_currency}"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                return data["conversion_rates"][to_currency]
        except Exception:
            pass # Fall back to dummy rate

    return fallback_rates.get((from_currency, to_currency), 1.0)


def calculate_transfer(amount, from_country, to_country):

    # Map countries to currency
    currency_map = {
        "USA": "USD",
        "India": "INR"
    }

    from_currency = currency_map.get(from_country, "USD")
    to_currency = currency_map.get(to_country, "INR")

    rate = get_live_rate(from_currency, to_currency)

    # Simulated fee logic (1% fee)
    fee = amount * 0.01

    received = (amount - fee) * rate

    return {
        "from_country": from_country,
        "to_country": to_country,
        "exchange_rate": rate,
        "fee": round(fee, 2),
        "amount_received": round(received, 2),
        "amount": amount
    }