# SIMPANCREAS PREDICTOR
simpancreas Linear Blood Glucose Prediction Algorithm

To read a little bit about the background of this piece of code please go to:
http://bustavo.com/simpancreas_predictor/ 

The code is written in Ruby. 

To run it you will need Ruby 2.2.1.

First clone the repository on your computer:

```
git clone http://bustavo.com/simpancreas_predictor/
```

To get a prediction for ONLY one value, you will need an array of 5 values:
```
ruby -r "./simpancreas_predictor.rb" -e "SimpancreasPredictor.get_prediction([90, 91, 91, 91, 91, 92])"
```

The script should return: 
94 which is the 20 minute prediction.

To get a prediction for a full array of data so you can graph it and compare the data with the prediction, get an array of at least 8 data points:
```
ruby -r "./simpancreas_predictor.rb" -e "SimpancreasPredictor.get_prediction([90, 91, 91, 91, 91, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 91, 91, 91])"
```

The script should return: 
"{original_data: [nil, nil, nil, nil, 91, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92], prediction_data: [nil, nil, nil, nil, nil, nil, nil, nil, 91, 95, 95, 95, 95, 95, 92, 92, 92, 92, 92, 92, 92, 92, 92]}"

You can now take the data and graph it :)

## TWEAKING NOTES

I have tested a couple of more aggressive predictor variables...

Although they have less delay in predicting a high or low, they will over predict...

So its basically comes down to a decision of:

A) Do you prefer a faster predictor reaction but predict much lower / higher values ( around 20 points off ) ?

B) Do you prefer a slower predictor reaction but predict more accurately ( within 5 points ) ?

The actual version is "B" but you can obviously move around the different variables and tweak it for your own needs.

If you modify the script and make it work for A & B at the same time... PLEASE to a pull-request or add an issue explaining how you achieved it.