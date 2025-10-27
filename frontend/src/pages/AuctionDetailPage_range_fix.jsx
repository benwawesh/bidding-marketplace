// Around line 230-240, replace the "Minimum Pledge" section with this:

                {/* Round Info */}
                <div className="space-y-3 mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-semibold mb-2">💰 Pledge Range</p>
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className="text-xs text-blue-600">Minimum</p>
                        <p className="text-xl font-bold text-blue-900">
                          {formatCurrency(currentRound.min_pledge)}
                        </p>
                      </div>
                      <div className="text-2xl text-blue-400">→</div>
                      <div className="text-center flex-1">
                        <p className="text-xs text-blue-600">Maximum</p>
                        <p className="text-xl font-bold text-blue-900">
                          {formatCurrency(currentRound.max_pledge)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-center text-blue-700 mt-2">
                      You must pledge within this range
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-sm text-gray-600">Entry Fee:</span>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(currentRound.participation_fee)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Highest:</span>
                    <span className="font-bold text-red-600 text-lg">
                      {product.highest_bid
                        ? formatCurrency(product.highest_bid)
                        : 'No bids yet'}
                    </span>
                  </div>
                </div>
