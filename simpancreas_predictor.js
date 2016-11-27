function bg_prediction(periods,cur_bg,bg_array,bg_date_array,time) {
  // This is the prediction function.
  // periods = number of periods you want predicted ( never tried anything different than 4... for bg in my opinion its the most you can predict with a linear predictor due to high variability of the data )
  // bg_array = This array represents the 4 last readings before the cur_bg
  // date_array = This array represents the 4 last readings dates before the cur_bg
  // cur_bg = This is the data point you are predicting upon.
  // time = This is the date data point you are predicting upon.
  
  // General predictor variables
  var bg = cur_bg;
  var dont_predict = false;
  bg_array.push(cur_bg);
  bg_date_array.push(time);
  var max_change = 15.0;

  // These are the linear predictor variables
  var speed = 0;
  var speed_a = 0.0;
  var speed_b = 0.0;
  var speed_c = 0.0;
  var a = 0;
  var b = 0;
  var c = 0;
  var d = 0;
  var e = 0;
  var f = 0;
  var w = [100,50,15,10];
  var i = 0;
  var n = 0;
  
  // Normalize input. If any reading is greater than the max velocity, it will correct them with the max_change
  // If there are missing data points ( dates too far away ), it will not predict.
  if ( bg_array.length > 1 ) {
    for(var i = 0; i < bg_array.length; i++) {
      if ( i > 0 ) {
        if ( ( bg_array[i] - bg_array[i-1] ) >= max_change ) {
          bg_array[i] = bg_array[i-1] + max_change;
        } else if ( ( bg_array[i] - bg_array[i-1] ) <= -max_change ) {
          bg_array[i] = bg_array[i-1] - max_change;
        }
      }
      if ( i == bg_array.length - 1 ) {
        if ( ((bg_date_array[i] - bg_date_array[i-1])/60000 > 20) || ( ( (bg_date_array[i] - bg_date_array[i-1])/60000 ) < 4 ) ) {
          dont_predict = true
        } 
      }
    }
    
    i = bg_array.length -1
  }
        
  if ( dont_predict == false ) {
    
    // Linear predictor iterations estimator
    if ( ( bg_date_array.length > 2 ) && ( ( bg_date_array[bg_date_array.length-1] - bg_date_array[bg_date_array.length-4] ) / 60000 < 15.1 ) ) {
      n = 4;
    } else if ( bg_date_array.length > 2 && ( ( bg_date_array[bg_date_array.length-1] - bg_date_array[bg_date_array.length-3] ) / 60000 < 10.1 ) ) {
      n = 3;
    } else if ( bg_date_array.length > 2 && ( ( bg_date_array[bg_date_array.length-1] - bg_date_array[bg_date_array.length-3] ) / 60000 < 5.1 ) ) {
      n = 2;
    }
    
    if ( n > 0 ) {
      
      // Linear predictor compartments
      for (var j = 0; j<n; j++) {
        a = a + w[j];
        b = Math.round((b + ( w[j] * ( bg_date_array[i-j] / 60000 ) ))/100)*100;
        c = Math.round((c + ( w[j] * bg_array[i-j] ))/100)*100;
        d = b;
        e = Math.round((e + ( w[j] * ( bg_date_array[i-j] / 60000 ) * ( bg_date_array[i-j] / 60000 ) ))/100)*100;
        f = Math.round((f + ( w[j] * bg_array[i-j] * ( bg_date_array[i-j] / 60000 ) ))/100)*100;
      }
      
      // I played with these changing places of variables and creating new functions. I wanted to offset a little bit the resulting "delay" in the prediction.
      if ( ( e - ( ( b * d ) / a ) ) > 0 ) {
        speed_a = Math.round(( ( f - ( ( c * d ) / a ) ) / ( e - ( ( b * d ) / a ) ) )*100)/100;
      }
      
      if ( ( e - ( ( a * d ) / b ) ) > 0 ) {
        speed_b = Math.round(( ( f - ( ( c * d ) / b ) ) / ( e - ( ( a * d ) / b ) ) )*100)/100;
      }
      
      if ( ( e - ( ( b * d ) / a ) ) > 0 ) {
        speed_c = Math.round(( ( f - ( ( c * d ) / a ) ) / ( e - ( ( b * d ) / a ) ) )*100)/100;
      }

      // Resultin speed from the compartments
      speed = ( speed_a * 0.4 ) + ( speed_b * 0.6 );
                
      // This part helps make aggressive low/high predictions
      average_array_speed = ( bg_array[bg_array.length-1] - bg_array[0] );
                
      if ( average_array_speed > 0 ) {
        bg = ( speed * ( average_array_speed ) ) + (cur_bg*1.2);
      }
                
      if ( average_array_speed < 0 ) {
        bg = ( speed * ( average_array_speed ) ) + (cur_bg/1.5);
      }
      
      bg = ( parseFloat(bg) * 0.3 ) + ( parseFloat( cur_bg ) * 0.7 );
      bg = ( ( (bg) * 0.5 ) ) + ( Math.round( parseFloat(speed_c) + parseFloat(cur_bg) ) * 0.5 );
                          
    }
    
    // Final calculated bg prediction
    return Math.round(bg);
    
  }
  
}

function get_prediction(bg_data,dates) {
  bg_data = bg_data.split(',');

  // Generate dates spaced by 5 minutes if no dates are passed
  var bg_dates = typeof dates !== undefined ? generate_dummy_date_data(bg_data) : dates;

  // If array is less than the minimum required data, return an error!
  if ( bg_data.length < 5 ) {
    $("#prediction").val("You need to send at least 5 data points");
  } else if ( bg_data.length < 9 ) {
    // Generate predictions
    $("#prediction").val(bg_prediction(4,bg_data[4],bg_data.slice(0,4),bg_dates.slice(0,4),bg_dates[4]));
  } else {
    // Generate predictions
    $("#prediction").val(get_predictions(bg_data,bg_dates));      
  }
}

function get_predictions(bg_data,dates) {
  // Setup iteration variables
  var original_data = [];
  var prediction_data = [];
  
  // Generate dates spaced by 5 minutes if no dates are passed
  var bg_dates = typeof dates !== undefined ? generate_dummy_date_data(bg_data) : dates;
  
  // Initialize output arrays. The first data points as set as nil as they are not predictions and are useless to compare the output data ( ie predicted vs real )
  for ( i = 0; i<= 7; i++) {
    prediction_data.push('null');
    
    if ( i < 4 ) {
      original_data.push('null')
    }
  }
  
  // Iterate through the array and generate a prediction to be added to the output array
  for ( j = 0; j < bg_data.length; j++) {
    if ( j >= 8 ) {
      original_data.push(bg_data[j-5])
      prediction_data.push(bg_prediction(4,bg_data[j-5],bg_data.slice(j-9,j-5), bg_dates.slice(j-9,j-5), bg_dates[j-5]))
    }        
  }
  
  return prediction_data;
  
}

function generate_dummy_date_data(bg_data) {
  // Generates dummy dates for the data entered
  // This will help predictions to be made considering standardly spaced data with no "missing points"
  var dates = [];
  var current_date = new Date();
  
  for (var i = 0; i <= bg_data.length; i++) {
    dates.push(current_date.getTime());
    current_date = new Date(current_date.setMinutes(current_date.getMinutes()+5));
  }
  
  return dates
}