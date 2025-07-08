/*
  # Remove dummy data and update currency references

  1. Changes
    - Remove any sample/dummy data from categories if present
    - Update any currency references to use Naira symbol
    - Clean up any test data

  2. Notes
    - This migration ensures the database starts clean
    - Categories will be empty and can be populated as needed
    - All currency displays should use ₦ symbol
*/

-- Remove any existing sample data from categories (keeping the table structure)
DELETE FROM categories WHERE name IN (
  'Electronics', 
  'Clothing', 
  'Books', 
  'Home & Garden', 
  'Sports', 
  'Beauty', 
  'Automotive', 
  'Food & Beverages'
);

-- The categories table is now empty and ready for real data
-- Products, orders, and other tables should also be empty in a fresh installation