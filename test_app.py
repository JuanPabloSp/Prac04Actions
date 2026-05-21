# Unit tests for app.py using Python's standard unittest framework
import unittest
from app import calculate_sum, get_system_status

class TestApp(unittest.TestCase):
    
    def test_calculate_sum_success(self):
        """Test that calculate_sum correctly adds numbers."""
        self.assertEqual(calculate_sum(5, 7), 12)
        self.assertEqual(calculate_sum(-1, 1), 0)
        self.assertEqual(calculate_sum(1.5, 2.5), 4.0)

    def test_calculate_sum_type_error(self):
        """Test that calculate_sum raises TypeError for non-numerical arguments."""
        with self.assertRaises(TypeError):
            calculate_sum("5", 7)
        with self.assertRaises(TypeError):
            calculate_sum(5, [7])

    def test_system_status(self):
        """Test that get_system_status returns expected metadata structure."""
        status = get_system_status()
        self.assertEqual(status["status"], "healthy")
        self.assertIn("python_version", status)
        self.assertIn("timestamp", status)

if __name__ == "__main__":
    print("=== Running Python Application Tests ===")
    unittest.main()
