class SimpancreasPredictor
  
  require "active_support/all"
  
  def self.bg_prediction(periods,cur_bg,bg_array=[],bg_date_array=[],time)    
    # This is the prediction function. 
    # periods = number of periods you want predicted ( never tried anything different than 4... for bg in my opinion its the most you can predict with a linear predictor due to high variability of the data )
    # bg_array = This array represents the 4 last readings before the cur_bg
    # date_array = This array represents the 4 last readings dates before the cur_bg
    # cur_bg = This is the data point you are predicting upon.
    # time = This is the date data point you are predicting upon.
    
    # General predictor variables
    bg = cur_bg # Just the same cur_bg
    dont_predict = false # Set to false by default. I dont want to run the predictor unless the data is suitable.
    bg_array.push(cur_bg) # Push the current data to array
    bg_date_array.push(time) # Push the current data to array
    max_change = 15.0 # This is the max speed I have decided I want to limit my data to. For me, whenever I get jumps of more than 12 points on my data... there is a sensor problem. I don't know if this has been documented or not, but I am not sure my body has the ability to jump more than 15 points by eating the types of carbs I am used to eating.
    
    # These are the linear predictor variables
    speed = 0
    speed_a = 0.0
    speed_b = 0.0
    speed_c = 0.0
    a     = 0
    b     = 0
    c     = 0
    d     = 0
    e     = 0
    f     = 0
    w     = [100,50,15,10]
    i = 0 # Used below to represent data points in array - 1
    n = 0 # Used below to iterate on the linear predictor to calculate each compartment
    
    # Normalize input. If any reading is greater than the max velocity, it will correct them with the max_change
    # If there are missing data points ( dates too far away ), it will not predict.
    if bg_array.size > 1
      bg_array.each_with_index do |bg,i|
        if i > 0
          if (bg_array[i]-bg_array[i-1]) >= max_change
            bg_array[i] = bg_array[i-1] + max_change
          elsif (bg_array[i]-bg_array[i-1]) <= -max_change
            bg_array[i] = bg_array[i-1] - max_change
          end
        end
        if i == bg_array.count-1
          if (bg_date_array[i] - bg_date_array[i-1])/60 > 20 || (bg_date_array[i] - bg_date_array[i-1])/60 < 4
            dont_predict = true
          end
        end
      end
      
      i = bg_array.size - 1
    end
    
    # So, predict only if the array is correct.
    unless dont_predict
      
      # Linear predictor iterations estimator
      if bg_date_array.size > 2 && ( ( bg_date_array.last.to_i - bg_date_array.last(3).first.to_i ) / 60.0 < 15.1 )
        n = 4
      elsif bg_date_array.size > 2 && ( ( bg_date_array.last.to_i - bg_date_array.last(2).first.to_i ) / 60.0 < 10.1 )
        n = 3
      elsif bg_date_array.size > 2 && ( ( bg_date_array.last.to_i - bg_date_array.last(2).first.to_i ) / 60.0 < 5.1 )
        n = 2
      end
    
      if (n > 0)
        
        # Linear predictor compartments
        0.upto(n-1) do |j|
          a = a + w[j]
          b = b + ( w[j] * ( bg_date_array[i-j].to_i / 60 ) )
          c = c + ( w[j] * bg_array[i-j] )
          d = b
          e = e + ( w[j] * ( bg_date_array[i-j].to_i / 60 ) * ( bg_date_array[i-j].to_i / 60 ) )
          f = f + ( w[j] * bg_array[i-j] * ( bg_date_array[i-j].to_i / 60 ) )
        end
        
        # I played with these changing places of variables and creating new functions. I wanted to offset a little bit the resulting "delay" in the prediction.
        if ( e - ( ( b * d ) / a ) ) > 0
          speed_a = ( ( f - ( ( c * d ) / a ) ) / ( e - ( ( b * d ) / a ) ) ).round(2)
        end
      
        if ( e - ( ( a * d ) / b ) ) > 0
          speed_b = ( ( f - ( ( c * d ) / b ) ) / ( e - ( ( a * d ) / b ) ) ).round(2)
        end
      
        if ( e - ( ( b * d ) / a ) ) > 0
          speed_c = ( ( f - ( ( c * d ) / a ) ) / ( e - ( ( b * d ) / a ) ) ).round(2)
        end
        
        # Resultin speed from the compartments
        speed = ( speed_a * 0.4 ) + ( speed_b * 0.6 )
        
      end
      
      # This part helps make aggressive low/high predictions
      average_array_speed = (bg_array.last - bg_array.first)
      bg = ( speed * ( average_array_speed ) ) + (cur_bg*1.2) if average_array_speed > 0
      bg = ( speed * ( average_array_speed ) ) + (cur_bg/1.5) if average_array_speed < 0
      
      bg = ( ( bg * 0.3 ) + ( ( cur_bg ) * 0.7) )      
      bg = ( ( bg * 0.5 ) + ( ( speed_c + cur_bg ) * 0.5 ) )
      
    end
    
    # Final calculated bg prediction
    return bg.round(0)
  end
  
  def self.get_prediction(bg_data)
    # If array is less than the minimum required data, return an error!
    if bg_data.count < 5
      p "You need to send at least 5 data points"
    elsif bg_data.count < 9
      dates = self.generate_dummy_date_data(bg_data)
      p SimpancreasPredictor.bg_prediction(4,bg_data[4],bg_data[0,4],dates[0,4],dates[4])
    else
      self.get_predictions(bg_data)
    end    
  end
  
  def self.get_predictions(bg_data) 
    # Setup iteration variables
    original_data = []
    prediction_data = []
    dates = []
    blood_glucoses = bg_data
   
    # Generate dates spaced by 5 minutes
    dates = self.generate_dummy_date_data(bg_data)
    
    # Initialize output arrays. The first data points as set as nil as they are not predictions and are useless to compare the output data ( ie predicted vs real )
    0.upto(7) do |n|
      prediction_data.push(nil)
      original_data.push(nil) if n < 4
    end
  
    # Iterate through the array and generate a prediction to be added to the output array
    blood_glucoses.each_with_index do |x,i|
      original_data.push(blood_glucoses[i-4]) if i >= 8
      prediction_data.push(SimpancreasPredictor.bg_prediction(4,blood_glucoses[i-4],blood_glucoses[i-9,4],dates[i-9,4],dates[i-4])) if i >= 8
    end
  
    # Return data arrays ( actually print them... )
    p "{original_data: #{original_data}, prediction_data: #{prediction_data}}"    
  end
  
  def self.generate_dummy_date_data(bg_data)
    # Generates dummy dates for the data entered
    # This will help predictions to be made considering standardly spaced data with no "missing points"
    dates = []
    current_date = Time.current
    
    0.upto(bg_data.count) do |n|
      dates.push(current_date)
      current_date = current_date.advance(:minutes => 5)
    end
    
    return dates
  end
  
end