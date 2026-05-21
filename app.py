# Sample Python Application for Laboratorio 4 CI/CD Security Practice
import time
import sys

def calculate_sum(a, b):
    """
    Safely calculates the sum of two numbers.
    Raises TypeError if arguments are not numerical.
    """
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise TypeError("Arguments must be numbers (int or float)")
    return a + b

def get_system_status():
    """
    Returns a dictionary indicating the status and metadata of the application.
    """
    return {
        "status": "healthy",
        "python_version": sys.version.split()[0],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

if __name__ == "__main__":
    print("=== Starting Python App ===")
    status = get_system_status()
    print(f"Status: {status}")
    print(f"5 + 7 = {calculate_sum(5, 7)}")
