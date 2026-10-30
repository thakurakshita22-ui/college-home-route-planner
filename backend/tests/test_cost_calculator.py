import pytest
from services.cost_calculator import estimate_cost

def test_car_cost():
    result=estimate_cost(30,"car",mileage=15,fuel_price=100)
    assert result["fuel_litres"]==2
    assert result["cost_inr"]==200

def test_walking_cost_zero():
    result=estimate_cost(4,"walking")
    assert result["cost_inr"]==0

def test_invalid_mileage():
    with pytest.raises(ValueError): estimate_cost(10,"car",mileage=0,fuel_price=100)
